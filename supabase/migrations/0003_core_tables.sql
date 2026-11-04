-- 0003: Core school-scoped tables (build_plan.md §5).
-- Conventions: UUID PKs, timestamptz timestamps, school_id on school-scoped rows.

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text not null unique,
  timezone text not null default 'UTC',
  logo_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.school_settings (
  school_id uuid primary key references public.schools(id) on delete cascade,
  academic_year text,
  working_days smallint[] not null default '{0,1,2,3,4}',
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  date_format text not null default 'yyyy-MM-dd',
  public_description text,
  vision text,
  mission text,
  objectives text,
  circular_policy jsonb not null default '{}'::jsonb,
  maintenance_policy jsonb not null default '{}'::jsonb,
  calendar_policy jsonb not null default '{}'::jsonb,
  notification_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index departments_school_idx on public.departments (school_id);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  building text not null,
  floor text,
  room text,
  kind text not null default 'room',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index locations_school_idx on public.locations (school_id);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  job_title text,
  school_id uuid references public.schools(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  is_active boolean not null default true,
  invited_by uuid references public.profiles(id),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_school_idx on public.profiles (school_id);
create index profiles_department_idx on public.profiles (department_id);

alter table public.departments
  add column head_profile_id uuid references public.profiles(id) on delete set null;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  school_id uuid references public.schools(id) on delete cascade,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index roles_system_key_idx on public.roles (key) where school_id is null;
create unique index roles_school_key_idx on public.roles (key, school_id) where school_id is not null;

create table public.permissions (
  key text primary key,
  category text not null default 'general'
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);

create table public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  school_id uuid references public.schools(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index assignments_platform_idx on public.user_role_assignments (user_id, role_id)
  where school_id is null and department_id is null;
create unique index assignments_school_idx on public.user_role_assignments (user_id, role_id, school_id)
  where school_id is not null and department_id is null;
create unique index assignments_department_idx on public.user_role_assignments (user_id, role_id, school_id, department_id)
  where department_id is not null;
create index assignments_user_idx on public.user_role_assignments (user_id);
create index assignments_school_idx2 on public.user_role_assignments (school_id);
create index assignments_role_idx on public.user_role_assignments (role_id);
