-- 0023: Lock down helper-function EXECUTE grants (finding H1).
--
-- Every helper in 0008/0009/0013 was created without an explicit grant, so it
-- inherited Postgres's default PUBLIC EXECUTE. That let anonymous callers probe
-- tenancy state (has_any_owner leaks whether any platform owner exists) and let
-- any caller mint school numbers (generate_school_number).
--
-- RLS policies and trusted server code still need the helpers, so access is
-- re-granted per role: policy helpers to authenticated, privileged helpers to
-- service_role only. Trigger functions run as their owner and need no grants.

revoke all on function public.is_active_user() from public, anon, authenticated;
revoke all on function public.is_platform_owner() from public, anon, authenticated;
revoke all on function public.is_school_member(uuid) from public, anon, authenticated;
revoke all on function public.can_access_department(uuid, uuid) from public, anon, authenticated;
revoke all on function public.has_permission(text, uuid, uuid) from public, anon, authenticated;
revoke all on function public.is_circular_target(uuid) from public, anon, authenticated;
revoke all on function public.effective_permission_keys() from public, anon, authenticated;

grant execute on function public.is_active_user() to authenticated, service_role;
grant execute on function public.is_platform_owner() to authenticated, service_role;
grant execute on function public.is_school_member(uuid) to authenticated, service_role;
grant execute on function public.can_access_department(uuid, uuid) to authenticated, service_role;
grant execute on function public.has_permission(text, uuid, uuid) to authenticated, service_role;
grant execute on function public.is_circular_target(uuid) to authenticated, service_role;
grant execute on function public.effective_permission_keys() to authenticated, service_role;

-- Privileged helpers: never callable by end users.
revoke all on function public.has_any_owner() from public, anon, authenticated;
grant execute on function public.has_any_owner() to service_role;

revoke all on function public.generate_school_number(uuid, text) from public, anon, authenticated;
grant execute on function public.generate_school_number(uuid, text) to service_role;

-- The only anonymous-facing policy that referenced a helper was
-- calendar_events_select (`to anon, authenticated`). Splitting it means anon no
-- longer evaluates has_permission/is_school_member, so the helper grants above
-- can stay authenticated-only.
drop policy calendar_events_select on public.calendar_events;

create policy calendar_events_select_public on public.calendar_events
  for select to anon
  using (status = 'published' and visibility = 'public');

create policy calendar_events_select_authenticated on public.calendar_events
  for select to authenticated
  using (
    (status = 'published' and visibility = 'public')
    or created_by = auth.uid()
    or public.has_permission('calendar.manage', school_id)
    or (status = 'published' and public.is_school_member(school_id))
  );
