-- 0007: Platform tables — notifications, audit, system settings, file metadata.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id) on delete cascade,
  type text not null default 'system',
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id, read_at);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  actor_id uuid references public.profiles(id),
  actor_label text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_school_created_idx on public.audit_logs (school_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create table public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.file_metadata (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  bucket text not null,
  path text not null unique,
  owner_id uuid references public.profiles(id),
  mime text,
  size_bytes bigint,
  purpose text not null,
  entity_type text,
  entity_id uuid,
  retention_until timestamptz,
  created_at timestamptz not null default now()
);
create index file_metadata_school_idx on public.file_metadata (school_id);
create index file_metadata_entity_idx on public.file_metadata (entity_type, entity_id);
