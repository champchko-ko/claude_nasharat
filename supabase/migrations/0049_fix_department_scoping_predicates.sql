-- 0049: Repair the department-scoping predicates that resolve to self-comparisons,
-- and align `school_achievements` writes with the agreed ownership model (D-3).
--
-- FI-16. Four policies written in `0022_write_scope.sql` and
-- `0029_school_achievements.sql` reference `school_id` / `department_id`
-- unqualified inside a subquery that aliases `user_role_assignments` as `ura`:
--
--     exists (select 1 from public.user_role_assignments ura
--              where ura.user_id = auth.uid()
--                and ura.school_id = school_id          -- inner scope wins
--                and ura.department_id = department_id) -- inner scope wins
--
-- Both comparisons resolve to the same column on both sides, so the predicate
-- is `ura.school_id = ura.school_id` and the department check is always true.
-- Verified on the local stack:
--
--   select tablename, policyname from pg_policies
--    where qual like '%ura.school_id = ura.school_id%'
--       or with_check like '%ura.school_id = ura.school_id%';
--
-- This migration only drops and recreates policies. No table, column or row is
-- modified, and no data is discarded.

-- ---------------------------------------------------------------------------
-- 1. circular_responses: the response's department must be one the responder
--    actually holds, in the same school as the response row.
--
--    The seeded model grants `circular.respond` to `department_head` only, and
--    department-head assignments always carry a department, so this restores
--    the intended check without changing any legitimate flow.
-- ---------------------------------------------------------------------------
drop policy if exists circular_responses_insert on public.circular_responses;
create policy circular_responses_insert on public.circular_responses
  for insert to authenticated
  with check (
    responder_id = auth.uid()
    and public.has_permission('circular.respond', school_id, department_id)
    and public.is_circular_target(circular_id)
    and exists (
      select 1 from public.circulars c
      where c.id = circular_id and c.school_id = school_id
    )
    and exists (
      select 1 from public.user_role_assignments ura
      where ura.user_id = auth.uid()
        and ura.school_id = public.circular_responses.school_id
        and ura.department_id = public.circular_responses.department_id
    )
  );

-- ---------------------------------------------------------------------------
-- 2. school_achievements: writes are a school-administrator action (D-3).
--
--    Members read (see `school_achievements_select_authenticated`, untouched).
--    The previous policies also let any member write rows attributed to a
--    department they do not belong to, because of the tautology above; they are
--    replaced by the same predicate the application guard uses.
-- ---------------------------------------------------------------------------
drop policy if exists school_achievements_insert on public.school_achievements;
create policy school_achievements_insert on public.school_achievements
  for insert to authenticated
  with check (
    public.is_platform_owner()
    or public.has_permission('calendar.manage', school_id)
  );

drop policy if exists school_achievements_update on public.school_achievements;
create policy school_achievements_update on public.school_achievements
  for update to authenticated
  using (
    public.is_platform_owner()
    or public.has_permission('calendar.manage', school_id)
  )
  with check (
    public.is_platform_owner()
    or public.has_permission('calendar.manage', school_id)
  );

drop policy if exists school_achievements_delete on public.school_achievements;
create policy school_achievements_delete on public.school_achievements
  for delete to authenticated
  using (
    public.is_platform_owner()
    or public.has_permission('calendar.manage', school_id)
  );
