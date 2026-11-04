-- 0061: role management is owner-only.
--
-- The deployed project had already removed `roles.manage` from school_admin by
-- hand (13 permissions, versus 14 produced by 0010), consistent with 061108b
-- which hides the roles & permissions tab from school administrators. Because
-- the removal was never encoded, every fresh reset re-granted the permission and
-- the RLS battery kept asserting a capability production no longer has.
--
-- What changes for a school administrator: they can still assign existing roles
-- to users (`assignments_insert` requires `users.manage`, which they keep), but
-- they can no longer create, rename, re-permission or delete roles
-- (`roles_insert/update/delete` and `role_permissions_write` all require
-- `roles.manage`). That is the owner's job.
--
-- Reversible: re-inserting the row restores the previous behaviour, so this is a
-- deliberate, one-line policy decision rather than a schema constraint.

delete from public.role_permissions rp
using public.roles r
where rp.role_id = r.id
  and r.key = 'school_admin'
  and r.school_id is null
  and rp.permission_key = 'roles.manage';
