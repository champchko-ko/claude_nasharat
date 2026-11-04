-- 0006: School calendar (doc §5.3).

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title_ar text not null,
  title_en text,
  description text,
  category text not null default 'event',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  visibility public.calendar_visibility not null default 'internal',
  status public.calendar_status not null default 'draft',
  location text,
  image_path text,
  created_by uuid not null references public.profiles(id),
  published_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);
create index calendar_events_school_dates_idx on public.calendar_events (school_id, starts_at);
create index calendar_events_visibility_idx on public.calendar_events (visibility, status);
