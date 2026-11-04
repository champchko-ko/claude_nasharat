-- 0021: Resolve circular targeting from role assignments, not the mutable
-- profile column (finding H4).
--
-- `is_circular_target` read `profiles.department_id`, a column the profile
-- owner could influence; department membership that grants access to a
-- circular's body and attachments must come from the caller's role assignment
-- - the same source every other authorization helper uses. Scoping the match
-- to the circular's school also stops an assignment in one tenant from
-- matching a target row in another.

create or replace function public.is_circular_target(p_circular uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circular_targets t
    join public.circulars c on c.id = t.circular_id
    where t.circular_id = p_circular
      and public.is_school_member(c.school_id)
      and (
        (
          t.department_id is not null
          and exists (
            select 1
            from public.user_role_assignments ura
            where ura.user_id = auth.uid()
              and ura.school_id = c.school_id
              and ura.department_id = t.department_id
          )
        )
        or (
          t.role_key is not null
          and exists (
            select 1
            from public.user_role_assignments ura
            join public.roles r on r.id = ura.role_id
            where ura.user_id = auth.uid()
              and r.key = t.role_key
              and ura.school_id = c.school_id
          )
        )
      )
  );
$$;
