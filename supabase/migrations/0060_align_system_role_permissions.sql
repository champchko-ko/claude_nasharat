-- 0060: give the platform owner the operational permission set.
--
-- The deployed project had drifted from 0010 by hand: the owner role held all
-- 16 permissions, while the seed grants only three (settings.platform.update,
-- roles.manage, audit.view). Without `circular.view_responses` the owner's
-- compliance figures were silently filtered by RLS (audit finding F1) — the
-- dashboard showed a school-wide rate computed from the owner's own rows.
--
-- Encoding the grant here makes a fresh `db reset` reproduce production and
-- closes F1 for any database built from these migrations.
--
-- Deliberately NOT encoded: the deployed `school_admin` is also missing
-- `roles.manage`. Removing it disables custom-role management for school
-- administrators (roles_insert/update/delete all require it) and the RLS battery
-- asserts that capability, so it is a product decision that needs its own
-- change, not a silent alignment. See COMPLIANCE_CHART_AUDIT.md §9.

insert into public.role_permissions (role_id, permission_key)
select r.id, seed.permission_key
from public.roles r
cross join (
  values
    ('audit.view'),
    ('calendar.manage'),
    ('circular.assign'),
    ('circular.create'),
    ('circular.publish'),
    ('circular.respond'),
    ('circular.view_responses'),
    ('maintenance.assign'),
    ('maintenance.close'),
    ('maintenance.create'),
    ('maintenance.update'),
    ('reports.view'),
    ('roles.manage'),
    ('settings.platform.update'),
    ('settings.school.update'),
    ('users.manage')
) as seed(permission_key)
where r.key = 'owner'
  and r.school_id is null
on conflict (role_id, permission_key) do nothing;
