-- 0012: Attach the triggers.

-- updated_at on every table that has the column.
do $$
declare
  t record;
begin
  for t in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables tb
      on tb.table_schema = c.table_schema and tb.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name = 'updated_at'
      and tb.table_type = 'BASE TABLE'
  loop
    execute format(
      'create trigger touch_%1$s before update on public.%1$I
         for each row execute function public.touch_updated_at()',
      t.table_name
    );
  end loop;
end $$;

-- Guards.
create trigger user_role_assignments_integrity
  before insert or update or delete on public.user_role_assignments
  for each row execute function public.enforce_assignment_integrity();

create trigger roles_guard
  before insert or update or delete on public.roles
  for each row execute function public.enforce_role_rules();

create trigger role_permissions_guard
  before insert or update or delete on public.role_permissions
  for each row execute function public.enforce_role_permissions_guard();

create trigger profiles_guard_self_update
  before update on public.profiles
  for each row execute function public.enforce_profile_self_update();

create trigger sync_profile_department
  after insert or update of department_id on public.profiles
  for each row execute function public.sync_profile_department_to_assignments();

create trigger notifications_guard_content
  before update on public.notifications
  for each row execute function public.enforce_notification_read_only();

create trigger circulars_status_guard
  before insert or update on public.circulars
  for each row execute function public.enforce_circular_status_transition();

create trigger circulars_scope
  before update on public.circulars
  for each row execute function public.enforce_circular_scope();

create trigger maintenance_requests_scope
  before update on public.maintenance_requests
  for each row execute function public.enforce_maintenance_update_scope();

create trigger maintenance_requests_transition
  before insert or update on public.maintenance_requests
  for each row execute function public.enforce_maintenance_transition();

create trigger trg_sync_maintenance_assignment
  after insert or update on public.maintenance_assignments
  for each row execute function public.sync_maintenance_request_operator();

-- Audit trail (after-row, so it records what was actually written).
do $$
declare
  t text;
begin
  foreach t in array array[
    'schools', 'school_settings', 'system_settings', 'departments', 'locations',
    'profiles', 'roles', 'role_permissions', 'user_role_assignments',
    'circulars', 'circular_targets', 'circular_responses', 'circular_attachments',
    'maintenance_requests', 'maintenance_assignments', 'maintenance_updates',
    'calendar_events', 'school_achievements', 'school_documents', 'file_metadata'
  ]
  loop
    execute format(
      'create trigger audit_%1$s after insert or update or delete on public.%1$I
         for each row execute function public.audit_row_change()',
      t
    );
  end loop;
end $$;
