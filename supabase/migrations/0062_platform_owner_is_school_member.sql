-- 0062: the platform owner is a member of every school.
--
-- `is_school_member()` counts school-scoped assignments only, and almost every
-- read policy is built on it (departments, circular targets, storage scopes).
-- An owner whose only assignment is the global `owner` role — exactly what
-- `bootstrap_platform_owner` creates — therefore saw no departments at all, so
-- the dashboard compliance widget rendered "no data" while every
-- `has_permission` check passed (audit finding F15). Production hides this by
-- also granting the owner `school_admin` in their school; a fresh install did
-- not.
--
-- The owner already passes `has_permission` platform-wide, so membership is the
-- only thing this adds: it makes the owner's view of a school consistent with
-- their authority instead of silently empty. School-scoped assignments are
-- unchanged for everyone else.

create or replace function public.is_school_member(p_school uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_user()
    and p_school is not null
    and (
      public.is_platform_owner()
      or exists (
        select 1
        from public.user_role_assignments ura
        where ura.user_id = auth.uid()
          and ura.school_id = p_school
      )
    );
$$;
