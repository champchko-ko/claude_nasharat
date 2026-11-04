-- 0038: Fix RLS battery regressions (finding N5 role catalog recursion and department head maintenance visibility).
--
-- 1. roles_select infinite recursion:
--    `roles_select` queried user_role_assignments to check if managers could read
--    system roles. That policy evaluated `assignments_select`, which in turn invoked
--    `is_platform_owner()`, which joined `public.roles`. Because `is_platform_owner()`
--    was written in `LANGUAGE sql`, PostgreSQL inlined it into the outer policy,
--    closing an infinite recursion cycle on `public.roles`.
--    Fix: Convert `is_platform_owner()` and `has_any_owner()` to `LANGUAGE plpgsql`
--    so they are never inlined, and extract system role readability check into
--    a dedicated `SECURITY DEFINER` function `can_read_system_roles()`.
--
-- 2. Department head maintenance visibility:
--    `maintenance_requests_select` previously relied on `reports.view` scoped to the
--    department. When `reports.view` was revoked from `department_head` for strict
--    Separation of Duties (preventing heads from accessing /reports), department
--    heads lost visibility of their department's tickets (scoring 0 instead of 1).
--    Fix: Add `is_department_head(school_id, department_id)` as a security definer
--    function and include it in `maintenance_requests_select`.

-- 1a. Convert owner checks to PL/pgSQL (prevents inlining into RLS queries)
create or replace function public.is_platform_owner()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.is_active_user() and exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = auth.uid()
      and ura.school_id is null
      and r.key = 'owner'
  );
end;
$$;

create or replace function public.has_any_owner()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where r.key = 'owner'
      and ura.school_id is null
  );
end;
$$;

-- 1b. Helper to check if caller can read system roles (executed with definer privileges)
create or replace function public.can_read_system_roles()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.is_active_user() and exists (
    select 1
    from public.user_role_assignments ura
    join public.role_permissions rp on rp.role_id = ura.role_id
    where ura.user_id = auth.uid()
      and ura.school_id is not null
      and rp.permission_key in ('users.manage', 'roles.manage')
  );
end;
$$;

revoke all on function public.can_read_system_roles() from public, anon;
grant execute on function public.can_read_system_roles() to authenticated;

-- 1c. Re-create roles_select policy without cyclic inlined joins
drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
  for select to authenticated
  using (
    public.is_platform_owner()
    or (
      school_id is not null
      and (
        public.has_permission('roles.manage', school_id)
        or public.has_permission('users.manage', school_id)
      )
    )
    or (
      is_system
      and public.can_read_system_roles()
    )
  );

-- 2a. Helper to check if caller is head of a specific department
create or replace function public.is_department_head(
  p_school uuid,
  p_department uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.is_active_user()
    and p_school is not null
    and p_department is not null
    and exists (
      select 1
      from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      where ura.user_id = auth.uid()
        and ura.school_id = p_school
        and ura.department_id = p_department
        and r.key = 'department_head'
    );
end;
$$;

revoke all on function public.is_department_head(uuid, uuid) from public, anon;
grant execute on function public.is_department_head(uuid, uuid) to authenticated;

-- 2b. Restore department head maintenance ticket visibility
drop policy if exists maintenance_requests_select on public.maintenance_requests;
create policy maintenance_requests_select on public.maintenance_requests
  for select to authenticated
  using (
    reporter_id = auth.uid()
    or assigned_operator_id = auth.uid()
    or public.has_permission('maintenance.assign', school_id)
    or public.has_permission('maintenance.close', school_id)
    or public.has_permission('reports.view', school_id, reporter_department_id)
    or public.is_department_head(school_id, reporter_department_id)
  );
