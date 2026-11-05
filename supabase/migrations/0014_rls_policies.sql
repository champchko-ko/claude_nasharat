-- 0014: Row-level security policies.
-- RLS was switched on for every table in 0008, so until now everything was
-- denied. Each table gets exactly the policies below. Principles:
--   * deny by default; no policy = no access;
--   * permissions, not role names, decide access (the owner holds all implicitly);
--   * department scoping comes from has_permission(key, department): a user whose
--     assignment is tied to a department only holds the permission there;
--   * the role/permission catalogue is written by the owner (roles) or by
--     migrations (permissions) only.
-- Writes by the service role (server tooling) bypass RLS by design.

-- A permission held through a school-wide assignment (no department). Used
-- where "sees everything" must not be granted to department-bound users.
create or replace function public.has_school_wide_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_user() and exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = auth.uid()
      and ura.department_id is null
      and (
        r.is_locked
        or exists (
          select 1 from public.role_permissions rp
          where rp.role_id = r.id and rp.permission_key = p_permission
        )
      )
  );
$$;

grant execute on function public.has_school_wide_permission(text) to authenticated;

-- ---------------------------------------------------------------- school
create policy schools_select on public.schools
  for select to authenticated
  using (public.is_school_member());

create policy schools_update on public.schools
  for update to authenticated
  using (public.has_permission('settings.school.update'))
  with check (public.has_permission('settings.school.update'));

create policy school_settings_select on public.school_settings
  for select to authenticated
  using (public.is_school_member());

create policy school_settings_insert on public.school_settings
  for insert to authenticated
  with check (public.has_permission('settings.school.update'));

create policy school_settings_update on public.school_settings
  for update to authenticated
  using (public.has_permission('settings.school.update'))
  with check (public.has_permission('settings.school.update'));

create policy system_settings_owner on public.system_settings
  for all to authenticated
  using (public.is_platform_owner())
  with check (public.is_platform_owner());

-- ------------------------------------------------------------ organisation
create policy departments_select on public.departments
  for select to authenticated
  using (public.is_school_member());

create policy departments_insert on public.departments
  for insert to authenticated
  with check (public.has_permission('settings.school.update'));

create policy departments_update on public.departments
  for update to authenticated
  using (public.has_permission('settings.school.update'))
  with check (public.has_permission('settings.school.update'));

create policy departments_delete on public.departments
  for delete to authenticated
  using (public.has_permission('settings.school.update'));

create policy locations_select on public.locations
  for select to authenticated
  using (public.is_school_member());

create policy locations_insert on public.locations
  for insert to authenticated
  with check (public.has_permission('settings.school.update'));

create policy locations_update on public.locations
  for update to authenticated
  using (public.has_permission('settings.school.update'))
  with check (public.has_permission('settings.school.update'));

create policy locations_delete on public.locations
  for delete to authenticated
  using (public.has_permission('settings.school.update'));

-- ------------------------------------------------------------------ people
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_school_member());

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (public.has_permission('users.manage'));

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.has_permission('users.manage'))
  with check (id = auth.uid() or public.has_permission('users.manage'));

-- ------------------------------------------------- roles and permissions
-- The owner alone creates, edits and deletes roles and chooses their
-- permissions. Triggers (0011) add the safety rules on top.
create policy roles_select on public.roles
  for select to authenticated
  using (
    public.is_platform_owner()
    or (key <> 'owner' and public.can_read_roles())
  );

create policy roles_owner_insert on public.roles
  for insert to authenticated
  with check (public.is_platform_owner());

create policy roles_owner_update on public.roles
  for update to authenticated
  using (public.is_platform_owner())
  with check (public.is_platform_owner());

create policy roles_owner_delete on public.roles
  for delete to authenticated
  using (public.is_platform_owner());

-- The catalogue itself changes only through migrations.
create policy permissions_select on public.permissions
  for select to authenticated
  using (public.is_school_member());

create policy role_permissions_select on public.role_permissions
  for select to authenticated
  using (public.is_school_member());

create policy role_permissions_owner_write on public.role_permissions
  for all to authenticated
  using (public.is_platform_owner())
  with check (public.is_platform_owner());

create policy assignments_select on public.user_role_assignments
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.has_permission('users.manage')
    or public.has_permission('audit.view')
  );

create policy assignments_insert on public.user_role_assignments
  for insert to authenticated
  with check (
    public.has_permission('users.manage')
    and (assigned_by is null or assigned_by = auth.uid())
    and exists (
      select 1 from public.roles r
      where r.id = user_role_assignments.role_id
        and (r.key <> 'owner' or public.is_platform_owner())
    )
  );

create policy assignments_update on public.user_role_assignments
  for update to authenticated
  using (public.has_permission('users.manage'))
  with check (
    public.has_permission('users.manage')
    and (assigned_by is null or assigned_by = auth.uid())
    and exists (
      select 1 from public.roles r
      where r.id = user_role_assignments.role_id
        and (r.key <> 'owner' or public.is_platform_owner())
    )
  );

create policy assignments_delete on public.user_role_assignments
  for delete to authenticated
  using (public.has_permission('users.manage'));

-- ---------------------------------------------------------------- circulars
-- Private ('internal') circulars: targets, creators and response viewers only.
-- Public circulars: anyone, once published.
create policy circulars_select_public on public.circulars
  for select to anon
  using (
    status = 'published'
    and visibility = 'public'
    and public.is_public_school_active()
  );

create policy circulars_select on public.circulars
  for select to authenticated
  using (
    created_by = auth.uid()
    or public.has_school_wide_permission('circular.view_responses')
    or (
      status in ('published', 'in_progress', 'completed', 'overdue')
      and public.is_school_member()
      and (visibility = 'public' or public.is_circular_target(id))
    )
  );

create policy circulars_insert on public.circulars
  for insert to authenticated
  with check (created_by = auth.uid() and public.has_permission('circular.create'));

create policy circulars_update on public.circulars
  for update to authenticated
  using (public.has_permission('circular.create') or public.has_permission('circular.publish'))
  with check (public.has_permission('circular.create') or public.has_permission('circular.publish'));

create policy circulars_delete on public.circulars
  for delete to authenticated
  using (public.has_permission('circular.create') or public.has_permission('circular.publish'));

create policy circular_targets_select on public.circular_targets
  for select to authenticated
  using (public.is_school_member());

create policy circular_targets_insert on public.circular_targets
  for insert to authenticated
  with check (
    public.has_permission('circular.create')
    and exists (select 1 from public.circulars c where c.id = circular_id)
  );

create policy circular_targets_update on public.circular_targets
  for update to authenticated
  using (public.has_permission('circular.create'))
  with check (
    public.has_permission('circular.create')
    and exists (select 1 from public.circulars c where c.id = circular_id)
  );

create policy circular_targets_delete on public.circular_targets
  for delete to authenticated
  using (public.has_permission('circular.create') or public.has_permission('circular.publish'));

-- Responses: the responder sees their own; response viewers see the departments
-- their permission covers (department-bound assignments only see their own).
create policy circular_responses_select on public.circular_responses
  for select to authenticated
  using (
    responder_id = auth.uid()
    or public.has_permission('circular.view_responses', department_id)
  );

create policy circular_responses_insert on public.circular_responses
  for insert to authenticated
  with check (
    responder_id = auth.uid()
    and public.has_permission('circular.respond', department_id)
    and public.is_circular_target(circular_id)
    and exists (select 1 from public.circulars c where c.id = circular_id)
    and (
      exists (
        select 1 from public.user_role_assignments ura
        where ura.user_id = auth.uid()
          and ura.department_id = circular_responses.department_id
      )
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and p.department_id = circular_responses.department_id
      )
    )
  );

create policy circular_responses_update on public.circular_responses
  for update to authenticated
  using (
    responder_id = auth.uid()
    and public.has_permission('circular.respond', department_id)
    and exists (select 1 from public.circulars c where c.id = circular_id and c.allow_response_revision)
  )
  with check (
    responder_id = auth.uid()
    and public.has_permission('circular.respond', department_id)
    and exists (select 1 from public.circulars c where c.id = circular_id)
  );

create policy circular_attachments_select_public on public.circular_attachments
  for select to anon
  using (
    exists (
      select 1 from public.circulars c
      where c.id = circular_id
        and c.status = 'published'
        and c.visibility = 'public'
        and public.is_public_school_active()
    )
  );

create policy circular_attachments_select on public.circular_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.circulars c
      where c.id = circular_id
        and (
          c.created_by = auth.uid()
          or public.has_school_wide_permission('circular.view_responses')
          or (
            c.status in ('published', 'in_progress', 'completed', 'overdue')
            and public.is_school_member()
            and (c.visibility = 'public' or public.is_circular_target(c.id))
          )
        )
    )
  );

create policy circular_attachments_insert on public.circular_attachments
  for insert to authenticated
  with check (
    public.has_permission('circular.create')
    and exists (select 1 from public.circulars c where c.id = circular_id)
  );

create policy circular_attachments_delete on public.circular_attachments
  for delete to authenticated
  using (public.has_permission('circular.create'));

-- -------------------------------------------------------------- maintenance
-- Maintenance is never public.
create policy maintenance_requests_select on public.maintenance_requests
  for select to authenticated
  using (
    reporter_id = auth.uid()
    or assigned_operator_id = auth.uid()
    or public.has_permission('maintenance.assign', reporter_department_id)
    or public.has_permission('maintenance.close', reporter_department_id)
    or public.has_permission('reports.view', reporter_department_id)
  );

create policy maintenance_requests_insert on public.maintenance_requests
  for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and public.has_permission('maintenance.create')
    and status = 'submitted'
    and assigned_operator_id is null
  );

create policy maintenance_requests_update on public.maintenance_requests
  for update to authenticated
  using (
    public.has_permission('maintenance.assign', reporter_department_id)
    or public.has_permission('maintenance.close', reporter_department_id)
    or (public.has_permission('maintenance.update') and assigned_operator_id = auth.uid())
    or reporter_id = auth.uid()
  )
  with check (
    public.has_permission('maintenance.assign', reporter_department_id)
    or public.has_permission('maintenance.close', reporter_department_id)
    or (public.has_permission('maintenance.update') and assigned_operator_id = auth.uid())
    -- Reporters may only push their own ticket into 'reopened' (with a reason).
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
          or public.has_permission('maintenance.assign', m.reporter_department_id)
          or public.has_permission('maintenance.update', m.reporter_department_id)
        )
    )
  );

create policy maintenance_assignments_insert on public.maintenance_assignments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and public.has_permission('maintenance.assign', m.reporter_department_id)
    )
  );

create policy maintenance_assignments_update on public.maintenance_assignments
  for update to authenticated
  using (
    exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and public.has_permission('maintenance.assign', m.reporter_department_id)
    )
  )
  with check (
    exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and public.has_permission('maintenance.assign', m.reporter_department_id)
    )
  );

create policy maintenance_assignments_delete on public.maintenance_assignments
  for delete to authenticated
  using (
    exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and public.has_permission('maintenance.assign', m.reporter_department_id)
    )
  );

create policy maintenance_updates_select on public.maintenance_updates
  for select to authenticated
  using (
    exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and (
          m.reporter_id = auth.uid()
          or m.assigned_operator_id = auth.uid()
          or public.has_permission('maintenance.update', m.reporter_department_id)
          or public.has_permission('maintenance.assign', m.reporter_department_id)
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
          or public.has_permission('maintenance.update', m.reporter_department_id)
          or public.has_permission('maintenance.assign', m.reporter_department_id)
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
          or public.has_permission('maintenance.assign', m.reporter_department_id)
          or public.has_permission('maintenance.update', m.reporter_department_id)
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
          or public.has_permission('maintenance.assign', m.reporter_department_id)
          or public.has_permission('maintenance.update', m.reporter_department_id)
        )
    )
  );

-- ------------------------------------------- calendar, achievements, documents
-- Creating or editing these needs the matching permission, and only those
-- people can set visibility = 'public' (D9).
create policy calendar_events_select_public on public.calendar_events
  for select to anon
  using (status = 'published' and visibility = 'public' and public.is_public_school_active());

create policy calendar_events_select on public.calendar_events
  for select to authenticated
  using (
    created_by = auth.uid()
    or public.has_permission('calendar.manage')
    or (status = 'published' and (visibility = 'public' or public.is_school_member()))
  );

create policy calendar_events_insert on public.calendar_events
  for insert to authenticated
  with check (public.has_permission('calendar.manage'));

create policy calendar_events_update on public.calendar_events
  for update to authenticated
  using (public.has_permission('calendar.manage') or created_by = auth.uid())
  with check (public.has_permission('calendar.manage'));

create policy school_achievements_select_public on public.school_achievements
  for select to anon
  using (visibility = 'public' and public.is_public_school_active());

create policy school_achievements_select on public.school_achievements
  for select to authenticated
  using (visibility = 'public' or public.is_school_member());

create policy school_achievements_insert on public.school_achievements
  for insert to authenticated
  with check (public.has_permission('calendar.manage'));

create policy school_achievements_update on public.school_achievements
  for update to authenticated
  using (public.has_permission('calendar.manage'))
  with check (public.has_permission('calendar.manage'));

create policy school_achievements_delete on public.school_achievements
  for delete to authenticated
  using (public.has_permission('calendar.manage'));

create policy school_documents_select_public on public.school_documents
  for select to anon
  using (status = 'published' and visibility = 'public' and public.is_public_school_active());

create policy school_documents_select on public.school_documents
  for select to authenticated
  using (
    (status = 'published' and (visibility = 'public' or public.is_school_member()))
    or public.has_permission('settings.school.update')
    or public.has_permission('users.manage')
  );

create policy school_documents_insert on public.school_documents
  for insert to authenticated
  with check (public.has_permission('settings.school.update') or public.has_permission('users.manage'));

create policy school_documents_update on public.school_documents
  for update to authenticated
  using (public.has_permission('settings.school.update') or public.has_permission('users.manage'))
  with check (public.has_permission('settings.school.update') or public.has_permission('users.manage'));

create policy school_documents_delete on public.school_documents
  for delete to authenticated
  using (public.has_permission('settings.school.update') or public.has_permission('users.manage'));

-- ----------------------------------------------------------------- platform
create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (public.has_permission('audit.view'));

create policy file_metadata_select on public.file_metadata
  for select to authenticated
  using (public.is_school_member());

create policy file_metadata_insert on public.file_metadata
  for insert to authenticated
  with check (public.is_platform_owner());

create policy backup_snapshots_select on public.backup_snapshots
  for select to authenticated
  using (public.is_platform_owner());

-- Anonymous visitors may only ever touch the five public-capable tables.
revoke all on all tables in schema public from anon;
grant select on
  public.circulars,
  public.circular_attachments,
  public.calendar_events,
  public.school_achievements,
  public.school_documents
to anon;

-- Live notifications.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
