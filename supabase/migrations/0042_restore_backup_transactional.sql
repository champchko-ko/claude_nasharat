-- 0042: transactional restore + pre-restore snapshots (audit findings C-3 / 3.4-3.6).
--
-- Before this migration restore was a loop of PostgREST upserts: no transaction,
-- no scope validation, no snapshot, and no way to rebuild `profiles` in a fresh
-- project because `auth.users` was never created. A failure halfway left the
-- tenant in a mixed state with no record of what had been written.
--
-- `restore_backup` now performs the whole restore in one function call, which
-- Postgres runs in a single transaction: either every table is written or none
-- is. It validates the scope, the table allowlist, and every row's tenant
-- before writing, and it reconciles the missing `auth.users` rows that
-- `profiles.id` depends on.
--
-- The JSON export is still a per-school configuration export, not disaster
-- recovery (decision D-5): it carries no passwords and no storage objects.

create table if not exists public.backup_snapshots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  reason text not null default 'pre-restore',
  table_counts jsonb not null default '{}'::jsonb,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists backup_snapshots_created_at_idx
  on public.backup_snapshots (created_at desc);

alter table public.backup_snapshots enable row level security;

-- Snapshots contain the same tenant data as the export; only the platform
-- owner may read them, and only through the app. Writes happen with the
-- service role from the restore action, so no INSERT/UPDATE/DELETE policy.
drop policy if exists backup_snapshots_select on public.backup_snapshots;
create policy backup_snapshots_select on public.backup_snapshots
  for select to authenticated using (public.is_platform_owner());

revoke all on public.backup_snapshots from anon, authenticated;
grant select on public.backup_snapshots to authenticated;
grant all on public.backup_snapshots to service_role;

-- Restores must write historical rows the live guards would reject: a ticket
-- that is already `resolved`, a circular that is already `published`. The flag
-- is set only inside `restore_backup`, for the duration of its transaction, so
-- no end-user path can borrow the exemption.
create or replace function public.enforce_maintenance_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
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

-- Creates the auth users a restored profile needs, preserving profile ids.
--
-- Exported files never contain credentials, so a restored account cannot sign
-- in until its password is set through the normal recovery flow. Without this
-- step the FK `profiles.id -> auth.users.id` aborts the restore after the first
-- six tables, which is what C-3 reported.
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

    -- GoTrue's email provider stores one identity per user; `provider_id` is
    -- the user id as text and `email` is generated from `identity_data`.
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

revoke all on function public.restore_backup_auth_users(jsonb) from public, anon, authenticated;

-- Restores a parsed backup payload in one transaction.
--
-- p_tables:  { "<table>": [rows...] } — unknown tables are rejected, not ignored
-- p_scope:   'school' | 'platform'
-- p_school:  required for 'school'; every row must belong to it
-- p_actor:   the operator; must be an active platform owner (verified here, not
--            trusted from the caller)
--
-- Runs with the service role so the table guards see no end-user identity: a
-- restore is not an end-user write. Ownership is verified against the role
-- assignment table instead of `is_platform_owner()`, which depends on a JWT.
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
  v_columns text;
  v_set_clause text;
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

    select string_agg(format('%I', column_name), ', ' order by ordinal_position)
      into v_columns
      from information_schema.columns
     where table_schema = 'public' and table_name = v_table;

    select string_agg(format('%I = excluded.%I', column_name, column_name), ', ')
      into v_set_clause
      from information_schema.columns
     where table_schema = 'public'
       and table_name = v_table
       and column_name <> all (v_conflict_cols);

    execute format(
      'insert into %s (%s) select %s from jsonb_populate_recordset(null::%s, $1)
       on conflict (%s) do update set %s',
      v_relation, v_columns, v_columns, v_relation, v_conflict, v_set_clause
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
