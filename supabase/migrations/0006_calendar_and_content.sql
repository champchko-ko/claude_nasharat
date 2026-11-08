-- 0006: Calendar, achievements and official documents (all can be public).

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text,
  description text,
  category text not null default 'event'
    check (category in ('event', 'academic', 'exam', 'holiday', 'meeting', 'activity', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  visibility public.content_visibility not null default 'internal',
  status public.calendar_status not null default 'draft',
  location text,
  image_path text,
  created_by uuid not null references public.profiles (id),
  published_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);
create index calendar_events_dates_idx on public.calendar_events (starts_at);
create index calendar_events_visibility_idx on public.calendar_events (visibility, status);
create index calendar_events_created_by_idx on public.calendar_events (created_by);

create table public.school_achievements (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments (id) on delete set null,
  title_ar text not null,
  title_en text,
  description text,
  category text not null default 'academic'
    check (category in ('academic', 'competition', 'sports', 'scientific', 'community', 'other')),
  date_achieved date not null default current_date,
  visibility public.content_visibility not null default 'internal',
  image_path text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index school_achievements_date_idx on public.school_achievements (date_achieved desc);
create index school_achievements_dept_idx on public.school_achievements (department_id);
create index school_achievements_visibility_idx on public.school_achievements (visibility);
create index school_achievements_created_by_idx on public.school_achievements (created_by);

-- Replaces the old `is_published` boolean with the same status + visibility
-- pair used everywhere else.
create table public.school_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug in ('operational-plan', 'committees-guide', 'counseling-guide')),
  title text not null,
  description text,
  file_path text not null,
  file_name text not null,
  file_size integer not null default 0,
  mime_type text not null default 'application/pdf',
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  visibility public.content_visibility not null default 'internal',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index school_documents_slug_idx on public.school_documents (slug, status, visibility, created_at desc);
create index school_documents_created_by_idx on public.school_documents (created_by);
