-- 0037: Allow school managers with settings.school.update permission to update their school row
drop policy if exists schools_update on public.schools;

create policy schools_update on public.schools
  for update to authenticated
  using (
    public.is_platform_owner()
    or (public.is_school_member(id) and public.has_permission('settings.school.update', id))
  )
  with check (
    public.is_platform_owner()
    or (public.is_school_member(id) and public.has_permission('settings.school.update', id))
  );
