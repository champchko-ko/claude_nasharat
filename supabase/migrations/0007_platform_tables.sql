-- 0007: Notifications, audit, system settings, file metadata, backups.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'system',
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id, read_at);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_label text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_actor_idx on public.audit_logs (actor_id);

create table public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.file_metadata (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null unique,
  owner_id uuid references public.profiles (id),
  mime text,
  size_bytes bigint,
  purpose text not null,
  entity_type text,
  entity_id uuid,
  retention_until timestamptz,
  created_at timestamptz not null default now()
);
create index file_metadata_entity_idx on public.file_metadata (entity_type, entity_id);

create table public.backup_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles (id) on delete set null,
  reason text not null default 'pre-restore',
  table_counts jsonb not null default '{}'::jsonb,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index backup_snapshots_created_at_idx on public.backup_snapshots (created_at desc);
