-- 0010: Permission catalog, system roles, matrix seeding (build_plan.md §6),
-- and the safe platform-owner bootstrap function.

insert into public.permissions (key, category) values
  ('circular.create', 'circulars'),
  ('circular.publish', 'circulars'),
  ('circular.assign', 'circulars'),
  ('circular.respond', 'circulars'),
  ('circular.view_responses', 'circulars'),
  ('maintenance.create', 'maintenance'),
  ('maintenance.assign', 'maintenance'),
  ('maintenance.update', 'maintenance'),
  ('maintenance.close', 'maintenance'),
  ('calendar.manage', 'calendar'),
  ('settings.school.update', 'settings'),
  ('settings.platform.update', 'settings'),
  ('users.manage', 'administration'),
  ('roles.manage', 'administration'),
  ('reports.view', 'reporting'),
  ('audit.view', 'audit')
on conflict (key) do nothing;

insert into public.roles (key, name, school_id, is_system) values
  ('owner', 'Application Owner', null, true),
  ('school_admin', 'School Administrator', null, true),
  ('department_head', 'Department Head', null, true),
  ('staff', 'Staff Member', null, true),
  ('operator', 'Maintenance Operator', null, true),
  ('auditor', 'Read-only Auditor', null, true)
on conflict (key) where school_id is null do nothing;

-- Initial matrix. Deny by default; anything absent is denied.
insert into public.role_permissions (role_id, permission_key)
select r.id, m.permission_key
from (
  values
    ('school_admin', 'circular.create'),
    ('school_admin', 'circular.publish'),
    ('school_admin', 'circular.assign'),
    ('school_admin', 'circular.view_responses'),
    ('school_admin', 'maintenance.create'),
    ('school_admin', 'maintenance.assign'),
    ('school_admin', 'maintenance.update'),
    ('school_admin', 'maintenance.close'),
    ('school_admin', 'calendar.manage'),
    ('school_admin', 'settings.school.update'),
    ('school_admin', 'users.manage'),
    ('school_admin', 'roles.manage'),
    ('school_admin', 'reports.view'),
    ('school_admin', 'audit.view'),
    ('owner', 'settings.platform.update'),
    ('owner', 'roles.manage'),
    ('owner', 'audit.view'),
    ('department_head', 'circular.respond'),
    ('department_head', 'maintenance.create'),
    ('staff', 'maintenance.create'),
    ('operator', 'maintenance.update'),
    ('auditor', 'audit.view'),
    ('auditor', 'reports.view')
) as m(role_key, permission_key)
join public.roles r on r.key = m.role_key and r.school_id is null
on conflict do nothing;

-- Safe one-time bootstrap: the FIRST authenticated user may claim the owner
-- role; every later attempt is rejected. No service credentials in the browser.
create or replace function public.bootstrap_platform_owner(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_any_owner() then
    raise exception 'Platform owner already exists';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Profile does not exist for the bootstrap user';
  end if;
  insert into public.user_role_assignments (user_id, role_id, school_id)
  select p_user_id, r.id, null
  from public.roles r
  where r.key = 'owner' and r.school_id is null;
end;
$$;

revoke all on function public.bootstrap_platform_owner(uuid) from public, anon;
grant execute on function public.bootstrap_platform_owner(uuid) to authenticated;
