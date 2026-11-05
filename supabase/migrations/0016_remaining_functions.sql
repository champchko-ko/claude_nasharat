-- 0016: Circular responses, user removal, backup restore. Single-school versions.

-- ---------------------------------------------------------------------------
-- Respond to a circular on behalf of a department (acknowledge / approve / ...).
-- Keeps the full history: the previous latest response is demoted, never edited.
-- ---------------------------------------------------------------------------
create or replace function public.submit_circular_response(
  p_circular_id uuid,
  p_department_id uuid,
  p_response_type public.circular_response_type,
  p_status public.circular_response_status,
  p_reason text default null
)
returns public.circular_responses
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new_row public.circular_responses;
  v_allow_revision boolean;
  v_prev_status public.circular_response_status;
  v_has_existing boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized: must be authenticated'
      using errcode = '42501';
  end if;

  -- 1. The caller may respond for this department.
  if not public.has_permission('circular.respond', p_department_id) then
    raise exception 'Unauthorized: caller lacks circular.respond permission'
      using errcode = '42501';
  end if;

  -- 2. The caller belongs to that department (assignment, or profile for a
  --    school-wide assignment).
  if not exists (
    select 1 from public.user_role_assignments ura
    where ura.user_id = auth.uid()
      and (
        ura.department_id = p_department_id
        or (
          ura.department_id is null
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.department_id = p_department_id
          )
        )
      )
  ) then
    raise exception 'Unauthorized: caller does not belong to department'
      using errcode = '42501';
  end if;

  -- 3. The circular exists and is published.
  select c.allow_response_revision into v_allow_revision
  from public.circulars c
  where c.id = p_circular_id
    and c.status = 'published';

  if not found then
    raise exception 'Circular not found or not published'
      using errcode = 'P0002';
  end if;

  -- 4. The caller is a target of the circular.
  if not public.is_circular_target(p_circular_id) then
    raise exception 'Circular is not targeted to this department'
      using errcode = '42501';
  end if;

  -- 5. An earlier response may only be replaced if it was a plain
  --    acknowledgement, or the circular allows revisions.
  select status into v_prev_status
  from public.circular_responses
  where circular_id = p_circular_id
    and department_id = p_department_id
    and is_latest = true;

  if found then
    v_has_existing := true;
    if v_prev_status != 'acknowledged' and not coalesce(v_allow_revision, false) then
      raise exception 'Circular does not allow response revisions'
        using errcode = '42501';
    end if;
  end if;

  -- 6. Demote the previous latest response.
  if v_has_existing then
    update public.circular_responses
    set is_latest = false, updated_at = now()
    where circular_id = p_circular_id
      and department_id = p_department_id
      and is_latest = true;
  end if;

  -- 7. Record the new response.
  insert into public.circular_responses (
    circular_id, department_id, responder_id, response_type, status, reason, is_latest
  ) values (
    p_circular_id, p_department_id, auth.uid(), p_response_type, p_status, p_reason, true
  ) returning * into v_new_row;

  return v_new_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Remove a user from the school: drop their role, clear their department and
-- deactivate the account. The profile row stays so history keeps its author.
-- ---------------------------------------------------------------------------
create or replace function public.dissociate_school_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_rows integer;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_user_id) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  if not public.has_permission('users.manage') then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  if p_user_id = v_actor then
    raise exception 'Cannot remove your own account' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = p_user_id and r.key = 'owner'
  ) then
    raise exception 'Cannot modify system-protected account' using errcode = '42501';
  end if;

  delete from public.user_role_assignments where user_id = p_user_id;

  update public.profiles
  set department_id = null,
      is_active = false,
      updated_at = now()
  where id = p_user_id;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Backup restore (server tooling only).
-- ---------------------------------------------------------------------------
create or replace function public.restore_backup_auth_users(p_profiles jsonb)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_row jsonb;
  v_id uuid;
  v_email text;
  v_created integer := 0;
begin
  if p_profiles is null or jsonb_typeof(p_profiles) <> 'array' then
    return 0;
  end if;

  for v_row in select * from jsonb_array_elements(p_profiles)
  loop
    v_id := (v_row ->> 'id')::uuid;
    v_email := nullif(v_row ->> 'email', '');

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_sso_user, is_anonymous,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token,
      email_change_confirm_status
    )
    values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email, '',
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      false, false,
      '', '', '',
      '', '',
      '', '', '',
      0
    )
    on conflict (id) do nothing;

    if found then
      v_created := v_created + 1;
    end if;

    -- GoTrue's email provider keeps one identity per user.
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    select
      v_id::text,
      v_id,
      jsonb_build_object(
        'sub', v_id::text,
        'email', v_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(), now(), now()
    where not exists (
      select 1 from auth.identities i where i.user_id = v_id and i.provider = 'email'
    );
  end loop;

  return v_created;
end;
$$;

-- Restores a backup file into this deployment, all or nothing.
-- Differences from the multi-tenant version:
--   * no scope or school argument;
--   * the school and its settings are single rows, updated in place;
--   * roles are matched by key (system roles keep their ids and flags), and the
--     role ids inside role_permissions / user_role_assignments are remapped, so a
--     backup restores into a freshly built project whose system role ids differ;
--   * the owner role, owner assignments and owner accounts can never be touched.
create or replace function public.restore_backup(
  p_tables jsonb,
  p_actor uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_order text[] := array[
    'schools', 'school_settings', 'departments', 'locations', 'roles',
    'role_permissions', 'profiles', 'user_role_assignments', 'school_sequences',
    'circulars', 'circular_targets', 'circular_responses',
    'maintenance_requests', 'maintenance_assignments', 'maintenance_updates',
    'calendar_events', 'school_achievements'
  ];
  v_table text;
  v_rows_json jsonb;
  v_relation text;
  v_conflict text;
  v_conflict_cols text[];
  v_payload_cols text[];
  v_columns text;
  v_set_clause text;
  v_action text;
  v_rows integer;
  v_counts jsonb := '{}'::jsonb;
  v_total integer := 0;
  v_auth_created integer := 0;
  v_role_map jsonb := '{}'::jsonb;
  v_head_links jsonb := '[]'::jsonb;
begin
  if p_actor is null or not exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    join public.profiles p on p.id = ura.user_id
    where ura.user_id = p_actor
      and r.key = 'owner'
      and p.is_active
  ) then
    raise exception 'Only the owner may restore a backup'
      using errcode = '42501';
  end if;

  if p_tables is null or jsonb_typeof(p_tables) <> 'object' then
    raise exception 'Backup payload must be a JSON object of tables'
      using errcode = '22023';
  end if;

  -- An unknown key means the file came from a different contract or was edited.
  if exists (
    select 1 from jsonb_object_keys(p_tables) as k
    where k <> all (v_order)
  ) then
    raise exception 'Backup payload contains a table outside the restore contract'
      using errcode = '22023';
  end if;

  -- A backup may never create or change an owner account.
  if p_tables ? 'profiles' and jsonb_typeof(p_tables -> 'profiles') = 'array' and exists (
    select 1
    from jsonb_array_elements(p_tables -> 'profiles') e
    join public.user_role_assignments ura on ura.user_id = (e ->> 'id')::uuid
    join public.roles r on r.id = ura.role_id
    where r.key = 'owner'
  ) then
    raise exception 'Backup contains an owner account'
      using errcode = '42501';
  end if;

  -- Auth users first, so profile foreign keys hold on a fresh project.
  if p_tables ? 'profiles' and jsonb_typeof(p_tables -> 'profiles') = 'array' then
    v_auth_created := public.restore_backup_auth_users(p_tables -> 'profiles');
  end if;

  perform set_config('app.restore_mode', 'on', true);

  foreach v_table in array v_order
  loop
    if not (p_tables ? v_table) then
      continue;
    end if;

    if jsonb_typeof(p_tables -> v_table) <> 'array' then
      raise exception 'Backup table % must be an array', v_table
        using errcode = '22023';
    end if;

    v_rows_json := p_tables -> v_table;

    if v_table in ('schools', 'school_settings') then
      -- Single-row tables: the backup row replaces the one existing row.
      select coalesce(jsonb_agg(e || '{"singleton": true}'::jsonb), '[]'::jsonb)
        into v_rows_json
        from jsonb_array_elements(v_rows_json) e;

    elsif v_table = 'departments' then
      -- departments.head_profile_id points at profiles, which come later:
      -- park the links and apply them after the profiles exist.
      select coalesce(jsonb_agg(jsonb_build_object('id', e -> 'id', 'head_profile_id', e -> 'head_profile_id'))
               filter (where nullif(e ->> 'head_profile_id', '') is not null), '[]'::jsonb)
        into v_head_links
        from jsonb_array_elements(v_rows_json) e;
      select coalesce(jsonb_agg(e - 'head_profile_id'), '[]'::jsonb)
        into v_rows_json
        from jsonb_array_elements(v_rows_json) e;

    elsif v_table = 'roles' then
      -- Match by key. Never write ids or system/locked flags, never touch owner.
      select coalesce(jsonb_agg(e - 'id' - 'is_system' - 'is_locked'), '[]'::jsonb)
        into v_rows_json
        from jsonb_array_elements(v_rows_json) e
        where e ->> 'key' is distinct from 'owner';

    elsif v_table in ('role_permissions', 'user_role_assignments') then
      if exists (
        select 1 from jsonb_array_elements(v_rows_json) e
        where not (v_role_map ? (e ->> 'role_id'))
      ) then
        raise exception 'Backup table % refers to an unknown or protected role', v_table
          using errcode = '42501';
      end if;
      select coalesce(jsonb_agg(jsonb_set(e, '{role_id}', to_jsonb(v_role_map ->> (e ->> 'role_id')))), '[]'::jsonb)
        into v_rows_json
        from jsonb_array_elements(v_rows_json) e;
    end if;

    v_relation := format('public.%I', v_table);
    v_conflict := case v_table
      when 'schools' then 'singleton'
      when 'school_settings' then 'singleton'
      when 'roles' then 'key'
      when 'role_permissions' then 'role_id, permission_key'
      when 'school_sequences' then 'kind, year'
      else 'id'
    end;
    v_conflict_cols := string_to_array(replace(v_conflict, ' ', ''), ',');

    -- Only the columns present in the payload are written.
    select array_agg(distinct k)
      into v_payload_cols
      from jsonb_array_elements(v_rows_json) e,
           jsonb_object_keys(e) k;

    if v_payload_cols is null then
      -- An empty table in the file is fine; there is nothing to restore.
      v_counts := v_counts || jsonb_build_object(v_table, 0);
      continue;
    end if;

    if not (v_conflict_cols <@ v_payload_cols) then
      raise exception 'Backup table % is missing its identity columns', v_table
        using errcode = '22023';
    end if;

    select string_agg(format('%I', column_name), ', ' order by ordinal_position)
      into v_columns
      from information_schema.columns
     where table_schema = 'public'
       and table_name = v_table
       and column_name = any (v_payload_cols);

    select string_agg(format('%I = excluded.%I', column_name, column_name), ', ')
      into v_set_clause
      from information_schema.columns
     where table_schema = 'public'
       and table_name = v_table
       and column_name = any (v_payload_cols)
       and column_name <> all (v_conflict_cols);

    v_action := case
      when v_set_clause is null then format('on conflict (%s) do nothing', v_conflict)
      else format('on conflict (%s) do update set %s', v_conflict, v_set_clause)
    end;

    execute format(
      'insert into %s (%s) select %s from jsonb_populate_recordset(null::%s, $1) %s',
      v_relation, v_columns, v_columns, v_relation, v_action
    )
    using v_rows_json;

    get diagnostics v_rows = row_count;
    v_counts := v_counts || jsonb_build_object(v_table, v_rows);
    v_total := v_total + v_rows;

    -- Once roles are in, map the file's role ids to the ids in this database.
    if v_table = 'roles' then
      select coalesce(jsonb_object_agg(e ->> 'id', r.id::text), '{}'::jsonb)
        into v_role_map
        from jsonb_array_elements(p_tables -> 'roles') e
        join public.roles r on r.key = e ->> 'key'
        where e ->> 'key' is distinct from 'owner'
          and e ->> 'id' is not null;
    end if;
  end loop;

  -- Department heads, now that profiles exist.
  update public.departments d
     set head_profile_id = (l ->> 'head_profile_id')::uuid
    from jsonb_array_elements(v_head_links) l
   where d.id = (l ->> 'id')::uuid
     and exists (select 1 from public.profiles p where p.id = (l ->> 'head_profile_id')::uuid);

  perform set_config('app.restore_mode', 'off', true);

  return jsonb_build_object(
    'tableCounts', v_counts,
    'totalRecords', v_total,
    'authUsersCreated', v_auth_created
  );
end;
$$;

-- ---------------------------------------------------------------- grants
revoke execute on function public.submit_circular_response(uuid, uuid, public.circular_response_type, public.circular_response_status, text) from public, anon;
revoke execute on function public.dissociate_school_user(uuid) from public, anon;
grant execute on function public.submit_circular_response(uuid, uuid, public.circular_response_type, public.circular_response_status, text) to authenticated, service_role;
grant execute on function public.dissociate_school_user(uuid) to authenticated, service_role;

-- Restore is server tooling only (service role), never callable by a browser session.
revoke execute on function public.restore_backup_auth_users(jsonb) from public, anon, authenticated;
revoke execute on function public.restore_backup(jsonb, uuid) from public, anon, authenticated;
grant execute on function public.restore_backup_auth_users(jsonb) to service_role;
grant execute on function public.restore_backup(jsonb, uuid) to service_role;
