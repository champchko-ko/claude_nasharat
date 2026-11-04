-- 0011: Row Level Security. Deny by default: every table gets RLS enabled;
-- access exists only through the policies below (or the service_role, which
-- bypasses RLS and stays server-side only).

do $$
declare
  t text;
begin
  foreach t in array array[
    'schools', 'school_settings', 'profiles', 'departments', 'locations',
    'roles', 'permissions', 'role_permissions', 'user_role_assignments',
    'circulars', 'circular_targets', 'circular_responses', 'circular_attachments',
    'maintenance_requests', 'maintenance_assignments', 'maintenance_updates',
    'maintenance_attachments', 'school_sequences', 'calendar_events',
    'notifications', 'audit_logs', 'system_settings', 'file_metadata'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- Schools: platform owner manages tenancy; members can read their school.
create policy schools_select on public.schools
  for select to authenticated
  using (public.is_platform_owner() or public.is_school_member(id));
create policy schools_insert on public.schools
  for insert to authenticated
  with check (public.is_platform_owner());
create policy schools_update on public.schools
  for update to authenticated
  using (public.is_platform_owner())
  with check (public.is_platform_owner());

-- School settings: members read; settings.school.update writes.
create policy school_settings_select on public.school_settings
  for select to authenticated
  using (public.is_school_member(school_id));
create policy school_settings_insert on public.school_settings
  for insert to authenticated
  with check (public.has_permission('settings.school.update', school_id));
create policy school_settings_update on public.school_settings
  for update to authenticated
  using (public.has_permission('settings.school.update', school_id))
  with check (public.has_permission('settings.school.update', school_id));

-- Profiles: self, platform owner, or same-school members.
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_platform_owner()
    or (school_id is not null and public.is_school_member(school_id))
  );
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (public.is_platform_owner() or public.has_permission('users.manage', school_id));
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_platform_owner() or public.has_permission('users.manage', school_id))
  with check (id = auth.uid() or public.is_platform_owner() or public.has_permission('users.manage', school_id));

-- Departments and locations: members read; school settings permission writes.
create policy departments_select on public.departments
  for select to authenticated using (public.is_school_member(school_id));
create policy departments_insert on public.departments
  for insert to authenticated
  with check (public.has_permission('settings.school.update', school_id));
create policy departments_update on public.departments
  for update to authenticated
  using (public.has_permission('settings.school.update', school_id))
  with check (public.has_permission('settings.school.update', school_id));
create policy locations_select on public.locations
  for select to authenticated using (public.is_school_member(school_id));
create policy locations_insert on public.locations
  for insert to authenticated
  with check (public.has_permission('settings.school.update', school_id));
create policy locations_update on public.locations
  for update to authenticated
  using (public.has_permission('settings.school.update', school_id))
  with check (public.has_permission('settings.school.update', school_id));

-- Roles: catalog visible to role/user managers; school-scoped custom roles
-- editable by school admins; system roles and platform roles are owner-only.
create policy roles_select on public.roles
  for select to authenticated
  using (
    public.is_platform_owner()
    or (
      school_id is not null
      and (public.has_permission('roles.manage', school_id) or public.has_permission('users.manage', school_id))
    )
  );
create policy roles_insert on public.roles
  for insert to authenticated
  with check (
    public.is_platform_owner()
    or (school_id is not null and not is_system and public.has_permission('roles.manage', school_id))
  );
create policy roles_update on public.roles
  for update to authenticated
  using (
    public.is_platform_owner()
    or (school_id is not null and not is_system and public.has_permission('roles.manage', school_id))
  )
  with check (
    public.is_platform_owner()
    or (school_id is not null and not is_system and public.has_permission('roles.manage', school_id))
  );
create policy roles_delete on public.roles
  for delete to authenticated
  using (
    public.is_platform_owner()
    or (school_id is not null and not is_system and public.has_permission('roles.manage', school_id))
  );

-- Permission catalog: readable by any authenticated user (not sensitive);
-- the matrix itself is platform configuration (owner-only writes).
create policy permissions_select on public.permissions
  for select to authenticated using (true);
create policy permissions_write on public.permissions
  for all to authenticated
  using (public.is_platform_owner())
  with check (public.is_platform_owner());
create policy role_permissions_select on public.role_permissions
  for select to authenticated using (true);
create policy role_permissions_write on public.role_permissions
  for all to authenticated
  using (public.is_platform_owner())
  with check (public.is_platform_owner());

-- Role assignments: visible to self + managers; changed only by managers.
-- The integrity trigger (0009) blocks self-grants and last-admin removal.
create policy assignments_select on public.user_role_assignments
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_platform_owner()
    or (
      school_id is not null
      and (public.has_permission('users.manage', school_id) or public.has_permission('audit.view', school_id))
    )
  );
create policy assignments_insert on public.user_role_assignments
  for insert to authenticated
  with check (
    public.is_platform_owner()
    or public.has_permission('users.manage', school_id)
    or public.has_permission('roles.manage', school_id)
  );
create policy assignments_update on public.user_role_assignments
  for update to authenticated
  using (
    public.is_platform_owner()
    or public.has_permission('users.manage', school_id)
    or public.has_permission('roles.manage', school_id)
  )
  with check (
    public.is_platform_owner()
    or public.has_permission('users.manage', school_id)
    or public.has_permission('roles.manage', school_id)
  );
create policy assignments_delete on public.user_role_assignments
  for delete to authenticated
  using (
    public.is_platform_owner()
    or public.has_permission('users.manage', school_id)
    or public.has_permission('roles.manage', school_id)
  );

-- Circulars: creator and response-dashboard holders always; targeted members
-- once published. Overdue/completed remain visible to targets.
create policy circulars_select on public.circulars
  for select to authenticated
  using (
    created_by = auth.uid()
    or public.has_permission('circular.view_responses', school_id)
    or (
      status in ('published', 'in_progress', 'completed', 'overdue')
      and public.is_school_member(school_id)
      and public.is_circular_target(id)
    )
  );
create policy circulars_insert on public.circulars
  for insert to authenticated
  with check (created_by = auth.uid() and public.has_permission('circular.create', school_id));
create policy circulars_update on public.circulars
  for update to authenticated
  using (
    created_by = auth.uid()
    or public.has_permission('circular.create', school_id)
    or public.has_permission('circular.publish', school_id)
  )
  with check (
    created_by = auth.uid()
    or public.has_permission('circular.create', school_id)
    or public.has_permission('circular.publish', school_id)
  );

create policy circular_targets_select on public.circular_targets
  for select to authenticated using (public.is_school_member(school_id));
create policy circular_targets_insert on public.circular_targets
  for insert to authenticated
  with check (public.has_permission('circular.create', school_id));
create policy circular_targets_update on public.circular_targets
  for update to authenticated
  using (public.has_permission('circular.create', school_id))
  with check (public.has_permission('circular.create', school_id));

-- Responses: respondent sees their own; the grouped dashboard permission
-- governs broader visibility. Identity is NOT exposed to routine viewers
-- through list views (server aggregates by department/job title, doc §5.1).
create policy circular_responses_select on public.circular_responses
  for select to authenticated
  using (responder_id = auth.uid() or public.has_permission('circular.view_responses', school_id));
create policy circular_responses_insert on public.circular_responses
  for insert to authenticated
  with check (
    responder_id = auth.uid()
    and public.has_permission('circular.respond', school_id, department_id)
  );
create policy circular_responses_update on public.circular_responses
  for update to authenticated
  using (
    responder_id = auth.uid()
    and public.has_permission('circular.respond', school_id, department_id)
    and exists (
      select 1 from public.circulars c
      where c.id = circular_id and c.allow_response_revision
    )
  )
  with check (
    responder_id = auth.uid()
    and public.has_permission('circular.respond', school_id, department_id)
  );

create policy circular_attachments_select on public.circular_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.circulars c
      where c.id = circular_id
        and (
          c.created_by = auth.uid()
          or public.has_permission('circular.view_responses', c.school_id)
          or (
            c.status in ('published', 'in_progress', 'completed', 'overdue')
            and public.is_school_member(c.school_id)
            and public.is_circular_target(c.id)
          )
        )
    )
  );
create policy circular_attachments_insert on public.circular_attachments
  for insert to authenticated
  with check (public.has_permission('circular.create', school_id));
create policy circular_attachments_delete on public.circular_attachments
  for delete to authenticated
  using (public.has_permission('circular.create', school_id));

-- Maintenance: reporter and assigned operator see their tickets; assignment
-- permission sees all; department heads via reports.view + department scope.
create policy maintenance_requests_select on public.maintenance_requests
  for select to authenticated
  using (
    reporter_id = auth.uid()
    or assigned_operator_id = auth.uid()
    or public.has_permission('maintenance.assign', school_id)
    or public.has_permission('maintenance.close', school_id)
    or (
      public.has_permission('reports.view', school_id)
      and public.can_access_department(school_id, reporter_department_id)
    )
  );
create policy maintenance_requests_insert on public.maintenance_requests
  for insert to authenticated
  with check (reporter_id = auth.uid() and public.has_permission('maintenance.create', school_id));
create policy maintenance_requests_update on public.maintenance_requests
  for update to authenticated
  using (
    public.has_permission('maintenance.assign', school_id)
    or public.has_permission('maintenance.close', school_id)
    or (public.has_permission('maintenance.update', school_id) and assigned_operator_id = auth.uid())
    or reporter_id = auth.uid()
  )
  with check (
    public.has_permission('maintenance.assign', school_id)
    or public.has_permission('maintenance.close', school_id)
    or (public.has_permission('maintenance.update', school_id) and assigned_operator_id = auth.uid())
    -- Reporters may only push their own ticket into 'reopened' (with reason).
    or (reporter_id = auth.uid() and status = 'reopened')
  );

create policy maintenance_assignments_select on public.maintenance_assignments
  for select to authenticated
  using (
    exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and (
          m.reporter_id = auth.uid()
          or m.assigned_operator_id = auth.uid()
          or public.has_permission('maintenance.assign', m.school_id)
          or public.has_permission('maintenance.update', m.school_id)
        )
    )
  );
create policy maintenance_assignments_insert on public.maintenance_assignments
  for insert to authenticated
  with check (public.has_permission('maintenance.assign', school_id));
create policy maintenance_assignments_update on public.maintenance_assignments
  for update to authenticated
  using (public.has_permission('maintenance.assign', school_id))
  with check (public.has_permission('maintenance.assign', school_id));
create policy maintenance_assignments_delete on public.maintenance_assignments
  for delete to authenticated
  using (public.has_permission('maintenance.assign', school_id));

-- Work history is append-only: participants add notes, nobody edits history.
create policy maintenance_updates_select on public.maintenance_updates
  for select to authenticated
  using (
    exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and (
          m.reporter_id = auth.uid()
          or m.assigned_operator_id = auth.uid()
          or public.has_permission('maintenance.assign', m.school_id)
          or (
            public.has_permission('reports.view', m.school_id)
            and public.can_access_department(m.school_id, m.reporter_department_id)
          )
        )
    )
  );
create policy maintenance_updates_insert on public.maintenance_updates
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and (
          m.reporter_id = auth.uid()
          or m.assigned_operator_id = auth.uid()
          or public.has_permission('maintenance.update', m.school_id)
          or public.has_permission('maintenance.assign', m.school_id)
        )
    )
  );

create policy maintenance_attachments_select on public.maintenance_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and (
          m.reporter_id = auth.uid()
          or m.assigned_operator_id = auth.uid()
          or public.has_permission('maintenance.assign', m.school_id)
          or public.has_permission('maintenance.update', m.school_id)
        )
    )
  );
create policy maintenance_attachments_insert on public.maintenance_attachments
  for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and (
          m.reporter_id = auth.uid()
          or m.assigned_operator_id = auth.uid()
          or public.has_permission('maintenance.assign', m.school_id)
          or public.has_permission('maintenance.update', m.school_id)
        )
    )
  );

-- Calendar: anonymous users see published public events only; members see
-- published internal events; managers and creators see everything.
create policy calendar_events_select on public.calendar_events
  for select to anon, authenticated
  using (
    (status = 'published' and visibility = 'public')
    or (
      auth.uid() is not null
      and (
        created_by = auth.uid()
        or public.has_permission('calendar.manage', school_id)
        or (status = 'published' and public.is_school_member(school_id))
      )
    )
  );
create policy calendar_events_insert on public.calendar_events
  for insert to authenticated
  with check (public.has_permission('calendar.manage', school_id));
create policy calendar_events_update on public.calendar_events
  for update to authenticated
  using (public.has_permission('calendar.manage', school_id) or created_by = auth.uid())
  with check (public.has_permission('calendar.manage', school_id));

-- Notifications: strictly per-user; inserts happen only server-side.
create policy notifications_select on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Audit: read for audit.view; append-only (writes happen in definer triggers).
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (
    public.is_platform_owner()
    or (school_id is not null and public.has_permission('audit.view', school_id))
  );

-- Platform configuration: owner-only.
create policy system_settings_select on public.system_settings
  for select to authenticated using (public.is_platform_owner());
create policy system_settings_write on public.system_settings
  for all to authenticated
  using (public.is_platform_owner())
  with check (public.is_platform_owner());

-- File metadata: school members; retention handled server-side.
create policy file_metadata_select on public.file_metadata
  for select to authenticated using (public.is_school_member(school_id));
create policy file_metadata_insert on public.file_metadata
  for insert to authenticated
  with check (public.is_school_member(school_id));

-- school_sequences: intentionally NO policies — service role only.
