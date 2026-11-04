-- 0047: dissociation happens only through `dissociate_school_user` (M-10).
--
-- `profiles_update_dissociate` (0036) intended to let a `users.manage` holder
-- detach a profile by PATCHing `school_id = NULL`. It never worked. For
-- `UPDATE`, PostgreSQL evaluates the `SELECT` policies against the NEW row as
-- well, and `profiles_select` requires `school_id IS NOT NULL AND
-- is_school_member(school_id)` (or the row's owner, or the platform owner).
-- A row that is being detached satisfies none of those, so every direct PATCH
-- failed with `new row violates row-level security policy for table
-- "profiles"` even though `profiles_update_dissociate`'s WITH CHECK
-- (`school_id IS NULL`) was satisfied.
--
-- Verified on the local stack: with the policy in place, both a school admin
-- and a `users.manage` holder were rejected; the same statement succeeds only
-- when the SELECT policy also accepts the new row (proved with a scratch
-- table and the identical policy set).
--
-- Keeping a policy that can never fire documents a path that does not exist,
-- so it is dropped. The supported path is `dissociate_school_user` (0046):
-- it verifies `users.manage` on the target's real school, refuses to remove
-- the last active administrator, and always deactivates the account.
--
-- `profiles_select` is deliberately unchanged: it is what keeps a direct API
-- call from orphaning an active account. Removal therefore only happens
-- through the guarded RPC. Forward-only; no data is touched.

drop policy if exists profiles_update_dissociate on public.profiles;

comment on policy profiles_select on public.profiles is
  'Load-bearing for dissociation: because PostgreSQL also checks SELECT policies against the NEW row, no direct UPDATE can set school_id to NULL. Detaching a user is only possible through public.dissociate_school_user (0046/0047).';
