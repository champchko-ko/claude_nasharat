-- 0034: Allow school administrators with roles.manage to manage role_permissions for school custom roles.

alter policy role_permissions_write on public.role_permissions
  using (
    public.is_platform_owner()
    or exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and r.school_id is not null
        and not r.is_system
        and public.has_permission('roles.manage', r.school_id)
    )
  )
  with check (
    public.is_platform_owner()
    or exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and r.school_id is not null
        and not r.is_system
        and public.has_permission('roles.manage', r.school_id)
    )
  );
