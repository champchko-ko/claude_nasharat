-- 0011: Guard functions used by triggers (role safety, scope, transitions, audit).
-- Service-role and migration work runs with no end-user identity (auth.uid() is
-- null) and is trusted; every end-user request carries a JWT subject.

-- ---------------------------------------------------------------------------
-- Role assignments: no self-edits, only the owner touches the owner role,
-- department-bound roles need a department, the last owner stays.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_assignment_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_old_id uuid;
  v_old_role_key text;
  v_new_role_key text;
  v_requires_department boolean;
  v_is_removal boolean;
begin
  -- OLD is unavailable on INSERT and NEW on DELETE; normalise both to jsonb.
  v_old := case when tg_op <> 'INSERT' then to_jsonb(old) else to_jsonb(new) end;
  v_new := case when tg_op <> 'DELETE' then to_jsonb(new) else to_jsonb(old) end;
  v_old_id := (v_old ->> 'id')::uuid;

  select r.key into v_old_role_key
  from public.roles r
  where r.id = (v_old ->> 'role_id')::uuid;

  select r.key, r.requires_department
    into v_new_role_key, v_requires_department
  from public.roles r
  where r.id = (v_new ->> 'role_id')::uuid;

  -- The has_any_owner() exception lets the very first owner be bootstrapped.
  if auth.uid() is not null
    and not public.is_platform_owner()
    and public.has_any_owner() then
    if auth.uid() = (v_old ->> 'user_id')::uuid
      or auth.uid() = (v_new ->> 'user_id')::uuid then
      raise exception 'Users cannot modify their own role assignments'
        using errcode = '42501';
    end if;

    if v_old_role_key = 'owner' or v_new_role_key = 'owner' then
      raise exception 'Only the owner can assign or change the owner role'
        using errcode = '42501';
    end if;
  end if;

  if tg_op <> 'DELETE'
    and coalesce(v_requires_department, false)
    and (v_new ->> 'department_id') is null then
    raise exception 'This role requires a department'
      using errcode = '23514';
  end if;

  -- A removal is a delete, or an update that rebinds the assignment's identity.
  v_is_removal := tg_op = 'DELETE'
    or (
      tg_op = 'UPDATE'
      and (
        (v_old ->> 'user_id') is distinct from (v_new ->> 'user_id')
        or (v_old ->> 'role_id') is distinct from (v_new ->> 'role_id')
      )
    );

  -- pg_trigger_depth() > 1 means an FK cascade (e.g. user deletion), which is
  -- trusted tooling, not an operator action. A null auth.uid() is service role.
  if v_is_removal and pg_trigger_depth() <= 1 and auth.uid() is not null then
    if v_old_role_key = 'owner' and not exists (
      select 1
      from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      join public.profiles p on p.id = ura.user_id
      where r.key = 'owner'
        and p.is_active
        and ura.id is distinct from v_old_id
    ) then
      raise exception 'Cannot remove the last active owner'
        using errcode = '42501';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Roles: system roles are permanent, keys and flags are fixed, a role with
-- users cannot be deleted. Who may write roles at all is decided by RLS.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_role_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_system then
      raise exception 'System roles cannot be deleted'
        using errcode = '42501';
    end if;
    if exists (select 1 from public.user_role_assignments ura where ura.role_id = old.id) then
      raise exception 'A role that still has users cannot be deleted'
        using errcode = '23503';
    end if;
    return old;
  end if;

  -- Migrations and service-role tooling run without an end-user identity.
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.key = 'owner' or new.is_system or new.is_locked then
      raise exception 'The owner key and the system/locked flags are reserved'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.key is distinct from old.key
    or new.is_system is distinct from old.is_system
    or new.is_locked is distinct from old.is_locked then
    raise exception 'A role''s key and system/locked flags cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- A locked role (the owner) holds everything implicitly; its grants are never stored.
create or replace function public.enforce_role_permissions_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locked boolean;
begin
  select r.is_locked into v_locked
  from public.roles r
  where r.id = coalesce(new.role_id, old.role_id);

  if coalesce(v_locked, false) and pg_trigger_depth() <= 1 then
    raise exception 'The owner role is locked and cannot be given or denied permissions'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create or replace function public.enforce_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if old.id = auth.uid() and new.department_id is distinct from old.department_id then
    raise exception 'profiles: you cannot change your own department'
      using errcode = '42501';
  end if;

  if old.is_active and not new.is_active then
    if exists (
      select 1
      from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      where ura.user_id = old.id and r.key = 'owner'
    ) and not exists (
      select 1
      from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      join public.profiles p on p.id = ura.user_id
      where r.key = 'owner' and p.is_active and ura.user_id <> old.id
    ) then
      raise exception 'Cannot deactivate the last active owner'
        using errcode = '42501';
    end if;
  end if;

  if public.is_platform_owner() or public.has_permission('users.manage') then
    return new;
  end if;

  if new.is_active is distinct from old.is_active
    or new.department_id is distinct from old.department_id then
    raise exception 'profiles: is_active and department_id may only be changed by a user manager'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- Keeps department-bound assignments in step with the profile's department.
create or replace function public.sync_profile_department_to_assignments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.department_id is distinct from old.department_id then
    update public.user_role_assignments ura
    set department_id = new.department_id, updated_at = now()
    from public.roles r
    where ura.user_id = new.id
      and r.id = ura.role_id
      and r.requires_department
      and ura.department_id is distinct from new.department_id;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Notifications: a recipient may only flip read_at.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_notification_read_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
    or new.type is distinct from old.type
    or new.title is distinct from old.title
    or new.body is distinct from old.body
    or new.entity_type is distinct from old.entity_type
    or new.entity_id is distinct from old.entity_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Only the read_at flag of a notification may be changed by its recipient'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Circulars
-- ---------------------------------------------------------------------------
create or replace function public.enforce_circular_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status in ('published', 'archived', 'cancelled')
      and not public.has_permission('circular.publish') then
      raise exception 'Publishing, archiving or cancelling a circular requires circular.publish'
        using errcode = '42501';
    end if;
    -- Only publishers may make a circular public.
    if new.visibility = 'public' and not public.has_permission('circular.publish') then
      raise exception 'Making a circular public requires circular.publish'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status
    and new.status in ('published', 'archived', 'cancelled')
    and not public.has_permission('circular.publish') then
    raise exception 'Publishing, archiving or cancelling a circular requires circular.publish'
      using errcode = '42501';
  end if;

  if new.visibility is distinct from old.visibility
    and new.visibility = 'public'
    and not public.has_permission('circular.publish') then
    raise exception 'Making a circular public requires circular.publish'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_circular_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_platform_owner() then
    return new;
  end if;
  if new.created_by is distinct from old.created_by
    or new.ref_number is distinct from old.ref_number then
    raise exception 'Circular identity fields cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Maintenance
-- ---------------------------------------------------------------------------
create or replace function public.enforce_maintenance_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Backup restore replays rows in their stored state.
  if current_setting('app.restore_mode', true) = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status is distinct from 'submitted' then
      raise exception 'New maintenance requests must start in submitted status';
    end if;
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'submitted' and new.status in ('triaged', 'assigned', 'rejected'))
    or (old.status = 'triaged' and new.status = 'assigned')
    or (old.status = 'assigned' and new.status in ('in_progress', 'waiting_for_parts'))
    or (old.status = 'in_progress' and new.status in ('waiting_for_parts', 'resolved'))
    or (old.status = 'waiting_for_parts' and new.status = 'in_progress')
    or (old.status = 'resolved' and new.status in ('closed', 'reopened'))
    or (old.status = 'closed' and new.status = 'reopened')
    or (old.status = 'reopened' and new.status in ('assigned', 'in_progress'))
  ) then
    raise exception 'Illegal maintenance status transition % -> %', old.status, new.status;
  end if;

  if new.first_response_at is null then
    new.first_response_at := now();
  end if;
  if new.status = 'resolved' then
    new.resolved_at := now();
  end if;
  if new.status = 'closed' then
    new.closed_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.enforce_maintenance_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  -- Maintenance managers may change anything the RLS policies allow.
  if public.has_permission('maintenance.assign')
    or public.has_permission('maintenance.close') then
    return new;
  end if;

  -- A reporter (who is not also an updater) may only reopen a resolved or
  -- closed request; nothing else on the row may change.
  if auth.uid() = old.reporter_id
    and not public.has_permission('maintenance.update') then
    if new.reporter_id is distinct from old.reporter_id
      or new.reporter_department_id is distinct from old.reporter_department_id
      or new.ticket_number is distinct from old.ticket_number
      or new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.category is distinct from old.category
      or new.location_id is distinct from old.location_id
      or new.priority is distinct from old.priority
      or new.assigned_operator_id is distinct from old.assigned_operator_id
      or new.closed_by is distinct from old.closed_by
      or new.resolved_at is distinct from old.resolved_at
      or new.closed_at is distinct from old.closed_at
      or new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'A reporter may only reopen their own request'
        using errcode = '42501';
    end if;
    if new.status is distinct from old.status and not (
      new.status = 'reopened' and old.status in ('resolved', 'closed')
    ) then
      raise exception 'A reporter may only reopen a resolved or closed request'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- Other permitted updaters may move status and notes, but not change the
  -- request's identity, department, priority or assignee.
  if new.reporter_id is distinct from old.reporter_id
    or new.reporter_department_id is distinct from old.reporter_department_id
    or new.ticket_number is distinct from old.ticket_number
    or new.priority is distinct from old.priority
    or new.assigned_operator_id is distinct from old.assigned_operator_id
    or new.rejection_reason is distinct from old.rejection_reason then
    raise exception 'Maintenance scope fields may only be changed by a maintenance manager'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.sync_maintenance_request_operator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active then
    update public.maintenance_requests
    set assigned_operator_id = new.operator_id,
        updated_at = now()
    where id = new.request_id;
  else
    update public.maintenance_requests
    set assigned_operator_id = null,
        updated_at = now()
    where id = new.request_id
      and assigned_operator_id = new.operator_id;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Audit trail
-- ---------------------------------------------------------------------------
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_entity uuid;
  v_meta jsonb;
  v_actor_id uuid;
  v_actor_label text;
  v_action text;
  v_headers jsonb;
begin
  -- Cascade deletes on security-critical tables are always logged; deep
  -- cascades on other tables are skipped to avoid log bloat.
  if pg_trigger_depth() > 1 then
    if tg_table_name not in ('user_role_assignments', 'role_permissions', 'roles', 'profiles') then
      if tg_op = 'DELETE' then
        return old;
      end if;
      return new;
    end if;
  end if;

  v_old := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;

  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_headers := null;
  end;

  -- An authenticated JWT wins; service-role writes fall back to settings/headers.
  if auth.uid() is not null then
    v_actor_id := auth.uid();
  else
    v_actor_id := coalesce(
      nullif(current_setting('app.actor_id', true), '')::uuid,
      nullif(v_headers ->> 'x-actor-id', '')::uuid
    );
  end if;

  v_actor_label := coalesce(
    nullif(current_setting('app.actor_label', true), ''),
    nullif(v_headers ->> 'x-actor-label', ''),
    (
      select case
        when p.email is not null and p.full_name is not null then p.full_name || ' (' || p.email || ')'
        when p.full_name is not null then p.full_name
        when p.email is not null then p.email
      end
      from public.profiles p
      where p.id = v_actor_id
    ),
    case when v_actor_id is null then 'system' end
  );

  -- Keep personal data out of the log for profiles.
  if tg_table_name = 'profiles' then
    v_old := case when v_old is null then null else jsonb_build_object(
      'id', v_old -> 'id',
      'is_active', v_old -> 'is_active',
      'department_id', v_old -> 'department_id'
    ) end;
    v_new := case when v_new is null then null else jsonb_build_object(
      'id', v_new -> 'id',
      'is_active', v_new -> 'is_active',
      'department_id', v_new -> 'department_id'
    ) end;
  end if;

  -- Keep long policy text out of the log for school_settings.
  if tg_table_name = 'school_settings' then
    v_old := case when v_old is null then null else jsonb_build_object(
      'academic_year', v_old -> 'academic_year',
      'working_days', v_old -> 'working_days',
      'locale', v_old -> 'locale',
      'date_format', v_old -> 'date_format'
    ) end;
    v_new := case when v_new is null then null else jsonb_build_object(
      'academic_year', v_new -> 'academic_year',
      'working_days', v_new -> 'working_days',
      'locale', v_new -> 'locale',
      'date_format', v_new -> 'date_format'
    ) end;
  end if;

  if tg_table_name = 'role_permissions' then
    -- role_permissions has a composite key: log against the role.
    v_entity := coalesce(v_new ->> 'role_id', v_old ->> 'role_id')::uuid;
  elsif tg_table_name = 'school_settings' then
    v_entity := null;
  else
    v_entity := coalesce(v_new ->> 'id', v_old ->> 'id')::uuid;
  end if;

  v_meta := jsonb_build_object('before', v_old, 'after', v_new);

  if tg_table_name = 'schools' then
    v_meta := v_meta || jsonb_build_object(
      'school_name_ar', coalesce(v_new ->> 'name_ar', v_old ->> 'name_ar'),
      'school_name_en', coalesce(v_new ->> 'name_en', v_old ->> 'name_en')
    );
  elsif tg_table_name = 'role_permissions' then
    v_meta := v_meta || jsonb_build_object(
      'permission_key', coalesce(v_new ->> 'permission_key', v_old ->> 'permission_key')
    );
  end if;

  v_action := case
    when pg_trigger_depth() > 1 and tg_op = 'DELETE' then tg_table_name || '.cascade_delete'
    else tg_table_name || '.' || lower(tg_op)
  end;

  insert into public.audit_logs (actor_id, actor_label, action, entity_type, entity_id, metadata)
  values (v_actor_id, v_actor_label, v_action, tg_table_name, v_entity, v_meta);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
