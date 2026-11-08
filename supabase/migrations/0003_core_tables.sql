-- 0003: School, organisation, people, roles and permissions.
-- One school per deployment: `schools` and `school_settings` are single-row
-- tables. Nothing else carries a tenant column; all resources belong to the
-- singleton school row.

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  -- Exactly one row can exist: `singleton` is unique and can only be true.
  singleton boolean not null default true unique check (singleton),
  name_ar text not null,
  name_en text not null,
  slug text not null unique,
  logo_path text,
  is_active boolean not null default true,
  phone text,
  email text,
  manager_name_ar text,
  manager_name_en text,
  assistant_manager_ar text,
  assistant_manager_en text,
  assistant_manager_2_ar text,
  assistant_manager_2_en text,
  address_ar text,
  address_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.school_settings (
  singleton boolean primary key default true check (singleton)
    references public.schools (singleton) on delete cascade,
  academic_year text,
  -- Day numbers 0 (Sunday) to 6 (Saturday), chosen by the school.
  working_days smallint[] not null default '{0,1,2,3,4}',
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  date_format text not null default 'yyyy-MM-dd',
  public_description text,
  vision text,
  mission text,
  objectives text,
  vision_ar text,
  vision_en text,
  mission_ar text,
  mission_en text,
  circular_policy jsonb not null default '{}'::jsonb,
  maintenance_policy jsonb not null default '{}'::jsonb,
  calendar_policy jsonb not null default '{}'::jsonb,
  notification_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  building text not null,
  floor text,
  room text,
  kind text not null default 'room',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  job_title text,
  department_id uuid references public.departments (id) on delete set null,
  is_active boolean not null default true,
  invited_by uuid references public.profiles (id) on delete set null,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_department_idx on public.profiles (department_id);
create index profiles_invited_by_idx on public.profiles (invited_by);

alter table public.departments
  add column head_profile_id uuid references public.profiles (id) on delete set null;
create index departments_head_profile_idx on public.departments (head_profile_id);

-- Permissions catalogue. Labels live here (not in application code) so there is
-- one source of truth. A permission only does something if code enforces it,
-- so new keys are added together with the policy or screen that uses them.
create table public.permissions (
  key text primary key,
  category text not null default 'general',
  name_ar text not null,
  name_en text not null,
  description text,
  sort_order integer not null default 0
);

-- Roles. The five system roles are seeded; the owner creates any others.
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]{1,62}$'),
  name_ar text not null,
  name_en text not null,
  is_system boolean not null default false,
  -- A locked role cannot have its permissions or key changed. Only `owner`.
  is_locked boolean not null default false,
  -- When true, a user holding the role must be assigned to a department.
  requires_department boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_locked or is_system)
);

-- Which permissions a role holds. Chosen entirely by the owner; no grants are
-- seeded. The locked owner role holds every permission implicitly.
create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_key text not null references public.permissions (key) on delete cascade,
  primary key (role_id, permission_key)
);
create index role_permissions_permission_key_idx on public.role_permissions (permission_key);

-- One role per user. The department applies to department-bound roles.
create table public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  department_id uuid references public.departments (id) on delete cascade,
  assigned_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assignments_role_idx on public.user_role_assignments (role_id);
create index assignments_department_idx on public.user_role_assignments (department_id);
create index assignments_assigned_by_idx on public.user_role_assignments (assigned_by);
