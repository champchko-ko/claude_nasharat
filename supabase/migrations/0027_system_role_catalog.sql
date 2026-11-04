-- 0027: Expose the system-role catalog to the admins who assign it (finding N5).
--
-- roles_select only admitted school-scoped roles, so the seeded system roles
-- (school_admin, department_head, staff, operator, auditor) were invisible to a
-- school administrator — the users & roles UI had no readable catalog even
-- though it is expected to assign those roles. Managers can now read the
-- system catalog; it stays read-only to them (insert/update are still
-- owner-only / school-scoped).

drop policy roles_select on public.roles;

create policy roles_select on public.roles
  for select to authenticated
  using (
    public.is_platform_owner()
    or (
      school_id is not null
      and (
        public.has_permission('roles.manage', school_id)
        or public.has_permission('users.manage', school_id)
      )
    )
    or (
      is_system
      and exists (
        select 1
        from public.user_role_assignments ura
        join public.role_permissions rp on rp.role_id = ura.role_id
        where ura.user_id = auth.uid()
          and ura.school_id is not null
          and rp.permission_key in ('users.manage', 'roles.manage')
      )
    )
  );
