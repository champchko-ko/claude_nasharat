-- 0035: Fix Security Definer View and address database linter findings.
--
-- 1. Public school profile access.
--
-- This migration originally switched the view to `security_invoker = true` and
-- added `schools_select_active` / `school_settings_select_active` policies for
-- `anon, authenticated` so the anonymous public page could read it. That
-- granted the anonymous key the FULL rows of both base tables, not just the
-- curated view columns: `school_settings` also carries `notification_prefs`,
-- `circular_policy`, `maintenance_policy` and `calendar_policy`, and the same
-- policies widened AUTHENTICATED reads to every active school regardless of
-- membership (verified against the local stack: anon read 2 schools and 1
-- school_settings row, and the battery's "anon sees no schools" /
-- "anon sees no school_settings" assertions failed).
--
-- The curated view is the correct shape for a public read path: it exposes
-- exactly the public columns of active schools and nothing else. It therefore
-- keeps the owner's rights (`security_invoker = false`) and the base tables
-- stay closed to anonymous callers. The `schools_select` /
-- `school_settings_select` policies from 0011 continue to serve authenticated
-- members.
--
-- Trade-off: `supabase lint` flags a `security_invoker = false` view. That
-- warning is accepted deliberately here — the view is the ONLY anonymous read
-- path, it lists no non-public column, and it filters to active schools. The
-- alternative (granting anon the base tables) leaks strictly more.
--
-- The base tables are left at their Supabase default table-level grant; RLS is
-- what denies them. With no `anon` policy on `schools` / `school_settings`,
-- an anonymous read returns zero rows (deny by default) rather than a 401,
-- which keeps the read path and the RLS battery's "anon sees no schools"
-- assertion meaningful.
alter view public.public_school_profiles set (security_invoker = false);

-- 2. Fix mutable search_path on functions
alter function public.touch_updated_at() set search_path = public;
alter function public.enforce_maintenance_transition() set search_path = public;

-- 3. Revoke direct RPC execution from anon on internal security definer functions
revoke execute on function public.audit_row_change() from anon;
revoke execute on function public.can_access_department(uuid, uuid) from anon;
revoke execute on function public.effective_permission_keys() from anon;
revoke execute on function public.enforce_assignment_integrity() from anon;
revoke execute on function public.generate_school_number(uuid, text) from anon;
revoke execute on function public.has_any_owner() from anon;
revoke execute on function public.has_permission(text, uuid, uuid) from anon;
revoke execute on function public.is_active_user() from anon;
revoke execute on function public.is_circular_target(uuid) from anon;
revoke execute on function public.is_platform_owner() from anon;
revoke execute on function public.is_school_member(uuid) from anon;

-- 4. Revoke direct RPC execution from authenticated on trigger-only functions
revoke execute on function public.audit_row_change() from authenticated;
revoke execute on function public.enforce_assignment_integrity() from authenticated;
