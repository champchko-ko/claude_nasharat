-- 0005: Maintenance requests. Always private: never exposed to anonymous visitors.

-- Per-year counters used to number circulars and tickets.
create table public.school_sequences (
  kind text not null check (kind in ('circular', 'maintenance')),
  year smallint not null,
  next_value integer not null default 1,
  primary key (kind, year)
);

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  title text not null,
  description text not null,
  category text not null default 'other'
    check (category in ('electrical', 'plumbing', 'hvac', 'carpentry', 'cleaning', 'it', 'safety', 'other')),
  location_id uuid references public.locations (id) on delete set null,
  area text,
  asset_ref text,
  reporter_id uuid not null references public.profiles (id),
  reporter_department_id uuid references public.departments (id) on delete set null,
  priority public.maintenance_priority not null default 'medium',
  status public.maintenance_status not null default 'submitted',
  assigned_operator_id uuid references public.profiles (id),
  target_response_at timestamptz,
  target_resolution_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  closed_by uuid references public.profiles (id),
  reopen_reason text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'reopened' or (reopen_reason is not null and length(btrim(reopen_reason)) > 0)),
  check (status <> 'rejected' or (rejection_reason is not null and length(btrim(rejection_reason)) > 0))
);
create index maintenance_requests_status_idx on public.maintenance_requests (status);
create index maintenance_requests_priority_idx on public.maintenance_requests (priority);
create index maintenance_requests_reporter_idx on public.maintenance_requests (reporter_id);
create index maintenance_requests_operator_idx on public.maintenance_requests (assigned_operator_id);
create index maintenance_requests_department_idx on public.maintenance_requests (reporter_department_id);
create index maintenance_requests_location_idx on public.maintenance_requests (location_id);
create index maintenance_requests_closed_by_idx on public.maintenance_requests (closed_by);

create table public.maintenance_assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests (id) on delete cascade,
  operator_id uuid not null references public.profiles (id),
  assigned_by uuid not null references public.profiles (id),
  assigned_at timestamptz not null default now(),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index maintenance_assignments_request_idx on public.maintenance_assignments (request_id);
create index maintenance_assignments_operator_idx on public.maintenance_assignments (operator_id);
create index maintenance_assignments_assigned_by_idx on public.maintenance_assignments (assigned_by);

create table public.maintenance_updates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  kind text not null check (kind in ('note', 'status_change', 'priority_change', 'assignment')),
  old_value text,
  new_value text,
  reason text,
  created_at timestamptz not null default now()
);
create index maintenance_updates_request_idx on public.maintenance_updates (request_id);
create index maintenance_updates_author_idx on public.maintenance_updates (author_id);

create table public.maintenance_attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests (id) on delete cascade,
  kind text not null default 'report' check (kind in ('report', 'evidence')),
  path text not null unique,
  mime text,
  size_bytes bigint,
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);
create index maintenance_attachments_request_idx on public.maintenance_attachments (request_id);
create index maintenance_attachments_uploaded_by_idx on public.maintenance_attachments (uploaded_by);
