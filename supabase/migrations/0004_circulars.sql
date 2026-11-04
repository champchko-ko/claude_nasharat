-- 0004: Circulars.

create table public.circulars (
  id uuid primary key default gen_random_uuid(),
  ref_number text not null unique,
  title text not null,
  body text not null,
  category text not null default 'general'
    check (category in ('general', 'administrative', 'academic', 'financial', 'activities', 'other')),
  priority public.circular_priority not null default 'normal',
  status public.circular_status not null default 'draft',
  -- 'internal' (default) = targeted departments and managers only.
  visibility public.content_visibility not null default 'internal',
  response_type public.circular_response_type not null default 'acknowledgement',
  response_instructions text,
  allow_response_revision boolean not null default false,
  publish_at timestamptz,
  due_at timestamptz,
  created_by uuid not null references public.profiles (id),
  closed_at timestamptz,
  closed_by uuid references public.profiles (id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index circulars_status_idx on public.circulars (status);
create index circulars_visibility_idx on public.circulars (visibility, status);
create index circulars_due_idx on public.circulars (due_at);
create index circulars_created_by_idx on public.circulars (created_by);
create index circulars_closed_by_idx on public.circulars (closed_by);

create table public.circular_targets (
  id uuid primary key default gen_random_uuid(),
  circular_id uuid not null references public.circulars (id) on delete cascade,
  department_id uuid references public.departments (id) on delete cascade,
  -- Targets a role by key. References roles so custom roles can be targeted
  -- and a hard-coded list of role names is never needed.
  role_key text references public.roles (key) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  check (department_id is not null or role_key is not null),
  unique nulls not distinct (circular_id, department_id, role_key)
);
create index circular_targets_circular_idx on public.circular_targets (circular_id);
create index circular_targets_department_idx on public.circular_targets (department_id);

create table public.circular_responses (
  id uuid primary key default gen_random_uuid(),
  circular_id uuid not null references public.circulars (id) on delete cascade,
  department_id uuid not null references public.departments (id) on delete cascade,
  responder_id uuid not null references public.profiles (id),
  response_type public.circular_response_type not null,
  status public.circular_response_status not null default 'acknowledged',
  reason text,
  is_latest boolean not null default true,
  revision_of uuid references public.circular_responses (id) on delete set null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'rejected' or (reason is not null and length(btrim(reason)) > 0))
);
create index circular_responses_circular_idx on public.circular_responses (circular_id);
create index circular_responses_department_idx on public.circular_responses (department_id);
create index circular_responses_responder_idx on public.circular_responses (responder_id);
create index circular_responses_revision_of_idx on public.circular_responses (revision_of);
-- One live response per (circular, department); revisions flip is_latest on the old row.
create unique index circular_responses_latest_idx
  on public.circular_responses (circular_id, department_id) where is_latest;

create table public.circular_attachments (
  id uuid primary key default gen_random_uuid(),
  circular_id uuid not null references public.circulars (id) on delete cascade,
  path text not null unique,
  mime text,
  size_bytes bigint,
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);
create index circular_attachments_circular_idx on public.circular_attachments (circular_id);
create index circular_attachments_uploaded_by_idx on public.circular_attachments (uploaded_by);
