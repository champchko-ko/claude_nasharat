-- 0029: School achievements register.

create table public.school_achievements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  title_ar text not null,
  title_en text,
  description text,
  category text not null default 'academic',
  date_achieved date not null default current_date,
  visibility text not null default 'internal' check (visibility in ('public', 'internal')),
  image_path text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index school_achievements_school_date_idx on public.school_achievements (school_id, date_achieved desc);
create index school_achievements_dept_idx on public.school_achievements (department_id);
create index school_achievements_visibility_idx on public.school_achievements (visibility);

alter table public.school_achievements enable row level security;

grant select, insert, update, delete on public.school_achievements to authenticated;
grant select on public.school_achievements to anon;

create policy school_achievements_select_public on public.school_achievements
  for select to anon
  using (visibility = 'public');

create policy school_achievements_select_authenticated on public.school_achievements
  for select to authenticated
  using (
    visibility = 'public'
    or public.is_school_member(school_id)
    or public.is_platform_owner()
  );

-- The author branch (`created_by = auth.uid()`) must still be bound to the
-- caller's own tenant. Without `is_school_member(school_id)` and a department
-- match, ANY authenticated user could write, publish (`visibility = 'public'`)
-- and then delete an achievement row in ANOTHER school: the publishable key is
-- public, so a crafted PostgREST request bypassed the application layer
-- entirely (verified against the local stack — see INSPECTION_REPORT.md).
--
-- The department rule mirrors the circular_responses insert policy (0022): the
-- author's own department assignment must be the target department.
create policy school_achievements_insert on public.school_achievements
  for insert to authenticated
  with check (
    public.is_platform_owner()
    or public.has_permission('calendar.manage', school_id)
    or (
      created_by = auth.uid()
      and public.is_school_member(school_id)
      and (
        department_id is null
        or exists (
          select 1 from public.user_role_assignments ura
          where ura.user_id = auth.uid()
            and ura.school_id = school_id
            and ura.department_id = department_id
        )
      )
    )
  );

create policy school_achievements_update on public.school_achievements
  for update to authenticated
  using (
    public.is_platform_owner()
    or public.has_permission('calendar.manage', school_id)
    or (
      created_by = auth.uid()
      and public.is_school_member(school_id)
      and (
        department_id is null
        or exists (
          select 1 from public.user_role_assignments ura
          where ura.user_id = auth.uid()
            and ura.school_id = school_id
            and ura.department_id = department_id
        )
      )
    )
  )
  with check (
    public.is_platform_owner()
    or public.has_permission('calendar.manage', school_id)
    or (
      created_by = auth.uid()
      and public.is_school_member(school_id)
      and (
        department_id is null
        or exists (
          select 1 from public.user_role_assignments ura
          where ura.user_id = auth.uid()
            and ura.school_id = school_id
            and ura.department_id = department_id
        )
      )
    )
  );

create policy school_achievements_delete on public.school_achievements
  for delete to authenticated
  using (
    public.is_platform_owner()
    or public.has_permission('calendar.manage', school_id)
    or (
      created_by = auth.uid()
      and public.is_school_member(school_id)
      and (
        department_id is null
        or exists (
          select 1 from public.user_role_assignments ura
          where ura.user_id = auth.uid()
            and ura.school_id = school_id
            and ura.department_id = department_id
        )
      )
    )
  );

-- The trigger function is `touch_updated_at()` (created in 0009). Referencing
-- `public.set_updated_at()` aborted the whole migration, so a clean
-- `supabase db reset` / CI stack build failed at 0029 (verified).
drop trigger if exists set_school_achievements_updated_at on public.school_achievements;
create trigger set_school_achievements_updated_at
  before update on public.school_achievements
  for each row execute function public.touch_updated_at();
