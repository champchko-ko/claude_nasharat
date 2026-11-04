-- 0059: retire the auditor system role.
--
-- The deployed project no longer has this role: it was deleted by hand after the
-- seeded catalogue (0010) created it. Because the deletion was never encoded in
-- a migration, a fresh `supabase db reset` re-created the role and drifted from
-- production. This migration records the intended state.
--
-- Idempotent by construction: a database that never had the role (or already
-- removed it) is unaffected. Assignments and permissions are deleted explicitly
-- even though both foreign keys cascade, so this still holds if a future
-- migration changes the cascade.

delete from public.user_role_assignments ura
using public.roles r
where ura.role_id = r.id
  and r.key = 'auditor'
  and r.school_id is null;

delete from public.role_permissions rp
using public.roles r
where rp.role_id = r.id
  and r.key = 'auditor'
  and r.school_id is null;

delete from public.roles
where key = 'auditor'
  and school_id is null;
