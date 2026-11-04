-- 0052: Audit trail and observability hardening (Phase 6 / findings M-15..M-21).
--
-- 1. Attributed service-role writes: reads app.actor_id / app.actor_label or
--    request headers (x-actor-id, x-actor-label) when auth.uid() is null.
-- 2. Snapshotted actor identity: actor_label is captured at write time so profile
--    deletion (which sets actor_id = null) retains operator attribution.
-- 3. Cascade deletes on security-critical tables (user_role_assignments,
--    role_permissions, roles, profiles) are no longer skipped.
-- 4. role_permissions attribution: resolves school_id and role entity from roles.
-- 5. school_settings metadata minimization: strips large policy payloads and text.
-- 6. Closes remaining unaudited tables: school_achievements,
--    maintenance_assignments, circular_responses, circular_attachments.

create or replace function public.set_audit_actor(
  p_actor_id uuid,
  p_actor_label text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.actor_id', coalesce(p_actor_id::text, ''), false);
  if p_actor_label is not null then
    perform set_config('app.actor_label', p_actor_label, false);
  end if;
end;
$$;

revoke execute on function public.set_audit_actor(uuid, text) from anon;
grant execute on function public.set_audit_actor(uuid, text) to authenticated, service_role;

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
  v_meta jsonb;
  v_actor_id uuid;
  v_actor_label text;
  v_action text;
  v_headers jsonb;
begin
  -- Cascade deletes on security-critical tables MUST NOT be skipped silently.
  -- Non-security child tables during deep cascades can be skipped to prevent log bloat.
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

  -- Read request headers safely if available
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_headers := null;
  end;

  -- Determine actor: authenticated JWT takes precedence.
  -- Service-role writes (where auth.uid() is null) fall back to settings or headers.
  if auth.uid() is not null then
    v_actor_id := auth.uid();
  else
    v_actor_id := coalesce(
      nullif(current_setting('app.actor_id', true), '')::uuid,
      nullif(v_headers ->> 'x-actor-id', '')::uuid
    );
  end if;

  -- Snapshot actor identity: full_name (email)
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

  -- Minimize stored metadata for profiles (protect PII)
  if tg_table_name = 'profiles' then
    v_old := case when v_old is null then null else jsonb_build_object(
      'id', v_old -> 'id',
      'is_active', v_old -> 'is_active',
      'school_id', v_old -> 'school_id',
      'department_id', v_old -> 'department_id'
    ) end;
    v_new := case when v_new is null then null else jsonb_build_object(
      'id', v_new -> 'id',
      'is_active', v_new -> 'is_active',
      'school_id', v_new -> 'school_id',
      'department_id', v_new -> 'department_id'
    ) end;
  end if;

  -- Minimize stored metadata for school_settings (strip huge policies & descriptions)
  if tg_table_name = 'school_settings' then
    v_old := case when v_old is null then null else jsonb_build_object(
      'school_id', v_old -> 'school_id',
      'academic_year', v_old -> 'academic_year',
      'working_days', v_old -> 'working_days',
      'locale', v_old -> 'locale',
      'date_format', v_old -> 'date_format'
    ) end;
    v_new := case when v_new is null then null else jsonb_build_object(
      'school_id', v_new -> 'school_id',
      'academic_year', v_new -> 'academic_year',
      'working_days', v_new -> 'working_days',
      'locale', v_new -> 'locale',
      'date_format', v_new -> 'date_format'
    ) end;
  end if;

  -- Resolve school_id and entity_id
  if tg_table_name = 'schools' then
    v_school := coalesce(v_new ->> 'id', v_old ->> 'id')::uuid;
    v_entity := v_school;
  elsif tg_table_name = 'role_permissions' then
    -- role_permissions has (role_id, permission_key), no school_id column
    v_school := (
      select r.school_id
      from public.roles r
      where r.id = coalesce(v_new ->> 'role_id', v_old ->> 'role_id')::uuid
    );
    v_entity := coalesce(v_new ->> 'role_id', v_old ->> 'role_id')::uuid;
  else
    v_school := coalesce(v_new ->> 'school_id', v_old ->> 'school_id')::uuid;
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

  insert into public.audit_logs (
    school_id,
    actor_id,
    actor_label,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    (select s.id from public.schools s where s.id = v_school),
    v_actor_id,
    v_actor_label,
    v_action,
    tg_table_name,
    v_entity,
    v_meta
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke execute on function public.audit_row_change() from anon, authenticated;

-- Triggers for remaining unaudited tables (finding M-15)
drop trigger if exists audit_school_achievements on public.school_achievements;
create trigger audit_school_achievements
  after insert or update or delete on public.school_achievements
  for each row execute function public.audit_row_change();

drop trigger if exists audit_maintenance_assignments on public.maintenance_assignments;
create trigger audit_maintenance_assignments
  after insert or update or delete on public.maintenance_assignments
  for each row execute function public.audit_row_change();

drop trigger if exists audit_circular_responses on public.circular_responses;
create trigger audit_circular_responses
  after insert or update or delete on public.circular_responses
  for each row execute function public.audit_row_change();

drop trigger if exists audit_circular_attachments on public.circular_attachments;
create trigger audit_circular_attachments
  after insert or update or delete on public.circular_attachments
  for each row execute function public.audit_row_change();

