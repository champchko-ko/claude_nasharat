-- 0056: Add missing indexes on foreign-key columns for cascade deletes and RLS performance.
-- Covers all foreign-key columns across core, circulars, maintenance, calendar, platform, and storage tables.

-- 1. Core organization and profiles
create index if not exists departments_head_profile_idx
  on public.departments (head_profile_id);

create index if not exists profiles_invited_by_idx
  on public.profiles (invited_by);

create index if not exists roles_school_idx
  on public.roles (school_id);

create index if not exists role_permissions_permission_key_idx
  on public.role_permissions (permission_key);

create index if not exists assignments_department_fk_idx
  on public.user_role_assignments (department_id);

create index if not exists assignments_assigned_by_idx
  on public.user_role_assignments (assigned_by);

-- 2. Circulars module
create index if not exists circulars_created_by_idx
  on public.circulars (created_by);

create index if not exists circulars_closed_by_idx
  on public.circulars (closed_by);

create index if not exists circular_targets_school_idx
  on public.circular_targets (school_id);

create index if not exists circular_responses_school_idx
  on public.circular_responses (school_id);

create index if not exists circular_responses_responder_idx
  on public.circular_responses (responder_id);

create index if not exists circular_responses_revision_of_idx
  on public.circular_responses (revision_of);

create index if not exists circular_attachments_school_idx
  on public.circular_attachments (school_id);

create index if not exists circular_attachments_uploaded_by_idx
  on public.circular_attachments (uploaded_by);

-- 3. Maintenance module
create index if not exists maintenance_requests_location_idx
  on public.maintenance_requests (location_id);

create index if not exists maintenance_requests_closed_by_idx
  on public.maintenance_requests (closed_by);

create index if not exists maintenance_assignments_school_idx
  on public.maintenance_assignments (school_id);

create index if not exists maintenance_assignments_assigned_by_idx
  on public.maintenance_assignments (assigned_by);

create index if not exists maintenance_updates_school_idx
  on public.maintenance_updates (school_id);

create index if not exists maintenance_updates_author_idx
  on public.maintenance_updates (author_id);

create index if not exists maintenance_attachments_school_idx
  on public.maintenance_attachments (school_id);

create index if not exists maintenance_attachments_uploaded_by_idx
  on public.maintenance_attachments (uploaded_by);

-- 4. Calendar and achievements
create index if not exists calendar_events_created_by_idx
  on public.calendar_events (created_by);

create index if not exists school_achievements_created_by_idx
  on public.school_achievements (created_by);

-- 5. Platform, audit, and system tables
create index if not exists notifications_school_idx
  on public.notifications (school_id);

create index if not exists audit_logs_actor_idx
  on public.audit_logs (actor_id);

create index if not exists system_settings_updated_by_idx
  on public.system_settings (updated_by);

create index if not exists file_metadata_owner_idx
  on public.file_metadata (owner_id);

create index if not exists backup_snapshots_school_idx
  on public.backup_snapshots (school_id);

create index if not exists backup_snapshots_created_by_idx
  on public.backup_snapshots (created_by);

create index if not exists school_documents_created_by_idx
  on public.school_documents (created_by);

