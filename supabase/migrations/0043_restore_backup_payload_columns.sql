-- 0043: restore only the columns the payload actually carries.
--
-- 0042 inserted `select <every column> from jsonb_populate_recordset(...)`.
-- A JSONB record defines every field, so an omitted key becomes NULL instead of
-- taking the column default: a minimal department row failed with
-- `null value in column "is_active"`. The same flaw would have wiped columns on
-- update, because the generated SET clause also covered columns the payload
-- never mentioned.
--
-- This forward fix derives the column list from the keys present in the
-- payload, so:
--   - omitted columns keep their database default on insert;
--   - omitted columns keep their current value on conflict-update;
--   - a row that carries only its key updates nothing (`do nothing`).
--
-- Every exported row still carries all columns, so a full export restores
-- exactly as before.

create or replace function public.restore_backup(
  p_tables jsonb,
  p_scope text,
  p_school uuid,
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
begin
  if p_actor is null or not exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    join public.profiles p on p.id = ura.user_id
    where ura.user_id = p_actor
      and ura.school_id is null
      and r.key = 'owner'
      and p.is_active
  ) then
    raise exception 'Only the platform owner may restore a backup'
      using errcode = '42501';
  end if;

  if p_scope is null or p_scope not in ('school', 'platform') then
    raise exception 'Unsupported backup scope: %', coalesce(p_scope, '<null>')
      using errcode = '22023';
  end if;

  if p_tables is null or jsonb_typeof(p_tables) <> 'object' then
    raise exception 'Backup payload must be a JSON object of tables'
      using errcode = '22023';
  end if;

  if p_scope = 'school' then
    if p_school is null then
      raise exception 'A school is required to restore a school-scoped backup'
        using errcode = '22023';
    end if;
    if not exists (select 1 from public.schools s where s.id = p_school) then
      raise exception 'Unknown school' using errcode = 'P0002';
    end if;
  end if;

  -- An unknown key means the file was written by a different contract or was
  -- hand-edited. Silently ignoring it would restore an incomplete tenant.
  if exists (
    select 1 from jsonb_object_keys(p_tables) as k
    where k <> all (v_order)
  ) then
    raise exception 'Backup payload contains a table outside the restore contract'
      using errcode = '22023';
  end if;

  -- Reconcile auth users before profiles so the FK holds on a fresh project.
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

    -- Tenant validation: for a school-scoped file every row must belong to
    -- that school. Only `role_permissions` has no school_id; it is validated
    -- through the role it grants.
    if p_scope = 'school' then
      if v_table = 'schools' then
        if exists (
          select 1 from jsonb_array_elements(p_tables -> v_table) e
          where (e ->> 'id')::uuid is distinct from p_school
        ) then
          raise exception 'Backup contains a school other than the restore target'
            using errcode = '42501';
        end if;
      elsif v_table = 'role_permissions' then
        if exists (
          select 1
          from jsonb_array_elements(p_tables -> v_table) e
          left join public.roles r on r.id = (e ->> 'role_id')::uuid
          where r.id is null
             or r.school_id is distinct from p_school
             or r.key = 'owner'
        ) then
          raise exception 'Backup contains a permission row outside the restore target'
            using errcode = '42501';
        end if;
      else
        if exists (
          select 1 from jsonb_array_elements(p_tables -> v_table) e
          where (e ->> 'school_id')::uuid is distinct from p_school
        ) then
          raise exception 'Backup table % contains a row outside the restore target', v_table
            using errcode = '42501';
        end if;
      end if;
    end if;

    v_relation := format('public.%I', v_table);
    v_conflict := case v_table
      when 'school_settings' then 'school_id'
      when 'role_permissions' then 'role_id, permission_key'
      when 'school_sequences' then 'school_id, kind, year'
      else 'id'
    end;
    v_conflict_cols := string_to_array(replace(v_conflict, ' ', ''), ',');

    -- The union of keys across the payload's rows: only these columns are
    -- written, so every other column keeps its default or its current value.
    select array_agg(distinct k)
      into v_payload_cols
      from jsonb_array_elements(p_tables -> v_table) e,
           jsonb_object_keys(e) k;

    if v_payload_cols is null then
      raise exception 'Backup table % contains no columns to restore', v_table
        using errcode = '22023';
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
    using p_tables -> v_table;

    get diagnostics v_rows = row_count;
    v_counts := v_counts || jsonb_build_object(v_table, v_rows);
    v_total := v_total + v_rows;
  end loop;

  perform set_config('app.restore_mode', 'off', true);

  return jsonb_build_object(
    'tableCounts', v_counts,
    'totalRecords', v_total,
    'authUsersCreated', v_auth_created
  );
end;
$$;

revoke all on function public.restore_backup(jsonb, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.restore_backup(jsonb, text, uuid, uuid) to service_role;
