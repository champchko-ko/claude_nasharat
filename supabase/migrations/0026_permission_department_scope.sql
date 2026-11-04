-- 0026: has_permission ignored department-scoped assignments (finding N12).
--
-- The department filter read `ura.department_id is null or ura.department_id =
-- p_department`. Callers that omit p_department (every school-scoped RLS policy
-- such as maintenance.create) make the second comparison NULL, which filters the
-- assignment out — so a department-scoped role (staff, department_head) held
-- NONE of its permissions in school-scoped contexts. Deny-by-default saved it
-- from leaking, but it also silently denied legitimate actions.
--
-- When no department is requested, any assignment in the school counts. When a
-- department IS requested, a department-scoped assignment must match it (a
-- school-wide assignment still satisfies it).

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
      and (p_department is null or ura.department_id is null or ura.department_id = p_department)
  );
$$;
