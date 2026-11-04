-- 0009: Shared functions and integrity triggers.

-- Generic updated_at maintenance.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'schools', 'school_settings', 'departments', 'locations', 'profiles', 'roles',
    'user_role_assignments', 'circulars', 'circular_responses', 'maintenance_requests',
    'calendar_events', 'system_settings'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.touch_updated_at()',
      t, t
    );
  end loop;
end;
$$;

-- Per-school document numbering: CIR-YYYY-NNNN / MR-YYYY-NNNN.
create or replace function public.generate_school_number(p_school uuid, p_kind text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year smallint := date_part('year', now())::smallint;
  v_next integer;
begin
  insert into public.school_sequences (school_id, kind, year, next_value)
  values (p_school, p_kind, v_year, 1)
  on conflict (school_id, kind, year)
  do update set next_value = public.school_sequences.next_value + 1
  returning next_value into v_next;

  if p_kind = 'circular' then
    return 'CIR-' || v_year || '-' || lpad(v_next::text, 4, '0');
  end if;
  return 'MR-' || v_year || '-' || lpad(v_next::text, 4, '0');
end;
$$;

-- Legal status transitions for maintenance requests (build_plan.md §5),
-- plus derived timestamps. Rejected/reopened require reasons via CHECKs.
create or replace function public.enforce_maintenance_transition()
returns trigger
language plpgsql
as $$
begin
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

create trigger maintenance_requests_transition
  before update on public.maintenance_requests
  for each row execute function public.enforce_maintenance_transition();

-- Role assignment guards: no self-service changes, platform roles are owner
-- territory, and the last active owner / school administrator is protected.
create or replace function public.enforce_assignment_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid;
  v_school uuid;
  v_role_key text;
  v_removed_id uuid;
begin
  if tg_op = 'DELETE' then
    v_target := old.user_id;
    v_school := old.school_id;
    v_removed_id := old.id;
    select r.key into v_role_key from public.roles r where r.id = old.role_id;
  else
    v_target := new.user_id;
    v_school := new.school_id;
    v_removed_id := old.id;
    select r.key into v_role_key from public.roles r where r.id = new.role_id;
  end if;

  if auth.uid() = v_target and not public.is_platform_owner() and public.has_any_owner() then
    raise exception 'Users cannot modify their own role assignments';
  end if;

  if v_school is null and not public.is_platform_owner() and public.has_any_owner() then
    raise exception 'Only the platform owner can manage platform-level roles';
  end if;

  if tg_op = 'DELETE'
    or (
      tg_op = 'UPDATE'
      and (
        old.user_id is distinct from new.user_id
        or old.role_id is distinct from new.role_id
        or old.school_id is distinct from new.school_id
      )
    )
  then
    if v_role_key = 'owner' and v_school is null and not exists (
      select 1
      from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      join public.profiles p on p.id = ura.user_id
      where r.key = 'owner'
        and ura.school_id is null
        and p.is_active
        and ura.id is distinct from v_removed_id
    ) then
      raise exception 'Cannot remove the last active platform owner';
    end if;

    if v_role_key = 'school_admin' and v_school is not null and not exists (
      select 1
      from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      join public.profiles p on p.id = ura.user_id
      where r.key = 'school_admin'
        and ura.school_id = v_school
        and p.is_active
        and ura.id is distinct from v_removed_id
    ) then
      raise exception 'Cannot remove the last active school administrator';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger user_role_assignments_integrity
  before insert or update or delete on public.user_role_assignments
  for each row execute function public.enforce_assignment_integrity();

-- Append-only audit trail for sensitive tables. Insert-only: no update/delete
-- policies exist on audit_logs, and clients never get insert access.
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_school uuid;
  v_entity uuid;
begin
  v_old := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;

  -- Do not log unnecessary personal data (doc §3).
  if tg_table_name = 'profiles' then
    v_old := case when v_old is null then null else jsonb_build_object(
      'id', v_old -> 'id', 'is_active', v_old -> 'is_active',
      'school_id', v_old -> 'school_id', 'department_id', v_old -> 'department_id'
    ) end;
    v_new := case when v_new is null then null else jsonb_build_object(
      'id', v_new -> 'id', 'is_active', v_new -> 'is_active',
      'school_id', v_new -> 'school_id', 'department_id', v_new -> 'department_id'
    ) end;
  end if;

  v_school := coalesce(v_new ->> 'school_id', v_old ->> 'school_id')::uuid;
  v_entity := coalesce(v_new ->> 'id', v_old ->> 'id')::uuid;

  insert into public.audit_logs (school_id, actor_id, actor_label, action, entity_type, entity_id, metadata)
  values (
    v_school,
    auth.uid(),
    case when auth.uid() is null then 'system' end,
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    v_entity,
    jsonb_build_object('before', v_old, 'after', v_new)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger audit_school_settings after insert or update or delete on public.school_settings
  for each row execute function public.audit_row_change();
create trigger audit_profiles after insert or update or delete on public.profiles
  for each row execute function public.audit_row_change();
create trigger audit_user_role_assignments after insert or update or delete on public.user_role_assignments
  for each row execute function public.audit_row_change();
create trigger audit_roles after insert or update or delete on public.roles
  for each row execute function public.audit_row_change();
create trigger audit_role_permissions after insert or update or delete on public.role_permissions
  for each row execute function public.audit_row_change();
create trigger audit_system_settings after insert or update or delete on public.system_settings
  for each row execute function public.audit_row_change();
create trigger audit_circulars after insert or update or delete on public.circulars
  for each row execute function public.audit_row_change();
create trigger audit_calendar_events after insert or update or delete on public.calendar_events
  for each row execute function public.audit_row_change();
