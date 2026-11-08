-- 0010: Authorization helpers.
-- Everything is evaluated at query time from the database, so a change to a
-- role's permissions applies immediately to users who are already signed in.
-- No function assumes that a particular role key holds a particular permission.
-- The one fixed rule: the locked `owner` role implicitly holds every permission.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_active from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.has_any_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where r.key = 'owner'
  );
$$;

create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_user() and exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = auth.uid()
      and r.key = 'owner'
  );
$$;

-- Any active user who holds a role.
create or replace function public.is_school_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_user() and exists (
    select 1
    from public.user_role_assignments ura
    where ura.user_id = auth.uid()
  );
$$;

-- True when the caller's role grants `p_permission` (locked roles grant all).
-- When a department is given, the caller's assignment must be school-wide
-- (no department) or tied to that department.
create or replace function public.has_permission(
  p_permission text,
  p_department uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_user() and exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = auth.uid()
      and (
        r.is_locked
        or exists (
          select 1
          from public.role_permissions rp
          where rp.role_id = r.id
            and rp.permission_key = p_permission
        )
      )
      and (
        p_department is null
        or ura.department_id is null
        or ura.department_id = p_department
      )
  );
$$;

-- Every permission key the caller holds. The owner gets the whole catalogue.
create or replace function public.effective_permission_keys()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select p.key
  from public.permissions p
  where public.is_platform_owner()
  union
  select rp.permission_key
  from public.user_role_assignments ura
  join public.role_permissions rp on rp.role_id = ura.role_id
  join public.profiles pr on pr.id = ura.user_id
  where ura.user_id = auth.uid()
    and pr.is_active;
$$;

-- True when the caller may act inside a department: a school-wide assignment
-- or one tied to that department.
create or replace function public.can_access_department(p_department uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_user()
    and exists (
      select 1
      from public.user_role_assignments ura
      where ura.user_id = auth.uid()
        and (ura.department_id is null or ura.department_id = p_department)
    );
$$;

-- Roles are readable by people who manage users or roles (and the owner).
create or replace function public.can_read_roles()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_owner()
    or public.has_permission('users.manage')
    or public.has_permission('roles.manage');
$$;

-- True when the caller is a target of the circular: by department (assignment
-- or profile) or by role key.
create or replace function public.is_circular_target(p_circular uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_school_member() and exists (
    select 1
    from public.circular_targets t
    where t.circular_id = p_circular
      and (
        (
          t.department_id is not null
          and (
            exists (
              select 1
              from public.user_role_assignments ura
              where ura.user_id = auth.uid()
                and ura.department_id = t.department_id
            )
            or exists (
              select 1
              from public.profiles p
              where p.id = auth.uid()
                and p.department_id = t.department_id
            )
          )
        )
        or (
          t.role_key is not null
          and exists (
            select 1
            from public.user_role_assignments ura
            join public.roles r on r.id = ura.role_id
            where ura.user_id = auth.uid()
              and r.key = t.role_key
          )
        )
      )
  );
$$;

-- Public pages only show content while the school is active.
create or replace function public.is_public_school_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.schools s where s.is_active);
$$;

-- The first user to sign in may claim the owner role, once.
create or replace function public.bootstrap_platform_owner(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_any_owner() then
    raise exception 'An owner already exists';
  end if;
  if p_user_id is distinct from auth.uid() then
    raise exception 'A user may only claim the owner role for themselves';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id and is_active) then
    raise exception 'Profile does not exist or is inactive for the bootstrap user';
  end if;
  insert into public.user_role_assignments (user_id, role_id)
  select p_user_id, r.id
  from public.roles r
  where r.key = 'owner';
end;
$$;

-- Document numbering: CIR-2026-0001 / MR-2026-0001, one counter per kind and year.
create or replace function public.generate_school_number(p_kind text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year smallint := date_part('year', now())::smallint;
  v_next integer;
begin
  insert into public.school_sequences (kind, year, next_value)
  values (p_kind, v_year, 1)
  on conflict (kind, year)
  do update set next_value = public.school_sequences.next_value + 1
  returning next_value into v_next;

  if p_kind = 'circular' then
    return 'CIR-' || v_year || '-' || lpad(v_next::text, 4, '0');
  end if;
  return 'MR-' || v_year || '-' || lpad(v_next::text, 4, '0');
end;
$$;

create or replace function public.next_school_number(p_kind text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_active_user() then
    raise exception 'An active account is required to allocate a document number'
      using errcode = '42501';
  end if;

  if p_kind is null or p_kind not in ('circular', 'maintenance') then
    raise exception 'Unsupported document kind: %', coalesce(p_kind, '<null>')
      using errcode = '22023';
  end if;

  if p_kind = 'circular' and not public.has_permission('circular.create') then
    raise exception 'Allocating a circular number requires circular.create'
      using errcode = '42501';
  end if;

  if p_kind = 'maintenance' and not public.has_permission('maintenance.create') then
    raise exception 'Allocating a maintenance number requires maintenance.create'
      using errcode = '42501';
  end if;

  return public.generate_school_number(p_kind);
end;
$$;

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
