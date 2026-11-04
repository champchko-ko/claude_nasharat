-- 0008: RBAC helper functions (build_plan.md §6). SECURITY DEFINER + stable:
-- they are called from RLS policies and must not leak beyond their predicate.

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
      and ura.school_id is null
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
      and ura.school_id is null
      and r.key = 'owner'
  );
$$;

create or replace function public.is_school_member(p_school uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_user()
    and p_school is not null
    and exists (
      select 1
      from public.user_role_assignments ura
      where ura.user_id = auth.uid()
        and ura.school_id = p_school
    );
$$;

create or replace function public.can_access_department(p_school uuid, p_department uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_user()
    and p_school is not null
    and exists (
      select 1
      from public.user_role_assignments ura
      where ura.user_id = auth.uid()
        and ura.school_id = p_school
        and (ura.department_id is null or ura.department_id = p_department)
    );
$$;

-- Deny by default: a permission holds only through an explicit
-- role_permissions row reachable from one of the caller's assignments.
create or replace function public.has_permission(
  p_permission text,
  p_school uuid default null,
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
    join public.role_permissions rp on rp.role_id = ura.role_id
    where ura.user_id = auth.uid()
      and rp.permission_key = p_permission
      and (
        (ura.school_id is null and p_school is null)
        or (ura.school_id is not null and ura.school_id = p_school)
      )
      and (ura.department_id is null or ura.department_id = p_department)
  );
$$;

-- True when the caller's department or one of their role keys is targeted.
create or replace function public.is_circular_target(p_circular uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circular_targets t
    where t.circular_id = p_circular
      and (
        (
          t.department_id is not null
          and t.department_id = (
            select p.department_id from public.profiles p where p.id = auth.uid()
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
              and ura.school_id = (
                select c.school_id from public.circulars c where c.id = p_circular
              )
          )
        )
      )
  );
$$;
