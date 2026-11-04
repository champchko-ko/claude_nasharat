-- 0048: Resolution of security findings M5, M9, M10, and N11.
--
-- M5: Platform assignments (school_id is null) have cross-school effect for
--     platform-level permissions such as `audit.view`.
-- M9: Restrict `roles` insert and update so non-platform managers cannot create
--     or rename roles with system keys ('owner', 'school_admin') or set is_system.
-- M10: School-scoped `effective_permission_keys(p_school uuid)` function.
-- N11: Added notifications.payload jsonb column, role_key domain check on
--      circular_targets, unicity of roles.key, and maintenance operator sync.
--
-- M8 is deliberately NOT applied here. `0036_production_audit_fixes.sql`
-- restricts `file_metadata` inserts to the platform owner because nothing in
-- the application reads or writes that table; widening the policy back to
-- school members would re-open the ownership-record fabrication primitive that
-- 0036 removed. The owner-only policy stays in force.

-- ---------------------------------------------------------------------------
-- 1. M5: has_permission with platform-scope inheritance
-- ---------------------------------------------------------------------------
create or replace function public.has_permission(
  p_permission text,
  p_school uuid default null,
  p_department uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_user() and exists (
    select 1
    from public.user_role_assignments ura
    join public.role_permissions rp on rp.role_id = ura.role_id
    where ura.user_id = auth.uid()
      and rp.permission_key = p_permission
      and (
        ura.school_id is null
        or (p_school is not null and ura.school_id = p_school)
      )
      and (p_department is null or ura.department_id is null or ura.department_id = p_department)
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. M9: roles insert & update key protection
-- ---------------------------------------------------------------------------
drop policy if exists roles_insert on public.roles;
create policy roles_insert on public.roles
  for insert to authenticated
  with check (
    public.is_platform_owner()
    or (
      school_id is not null
      and not is_system
      and key not in ('owner', 'school_admin')
      and public.has_permission('roles.manage', school_id)
    )
  );

drop policy if exists roles_update on public.roles;
create policy roles_update on public.roles
  for update to authenticated
  using (
    public.is_platform_owner()
    or (
      school_id is not null
      and not is_system
      and public.has_permission('roles.manage', school_id)
    )
  )
  with check (
    public.is_platform_owner()
    or (
      school_id is not null
      and not is_system
      and key not in ('owner', 'school_admin')
      and public.has_permission('roles.manage', school_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 3. N11: `roles.key` must be unique.
--
-- `circular_targets.role_key` is a free-text audience selector that the
-- application resolves to a role. Without uniqueness on `roles.key` a school
-- administrator can insert a second role keyed 'staff', grant it permissions,
-- and receive every circular addressed to `role_key = 'staff'`. Uniqueness also
-- makes the `circular_targets_role_key_check` domain meaningful.
--
-- Verified on the local catalog: six rows, six distinct keys
-- (owner, school_admin, department_head, staff, operator, auditor).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from public.roles group by key having count(*) > 1) then
    raise exception
      'roles.key contains duplicates; resolve them before applying 0048';
  end if;
end $$;

create unique index if not exists roles_key_unique on public.roles (key);

-- ---------------------------------------------------------------------------
-- 4. M10: school-scoped effective_permission_keys
--
-- The zero-argument form from `0013_effective_permissions.sql` is replaced,
-- not shadowed. `create or replace` with a defaulted parameter would leave the
-- zero-argument function in place and make `effective_permission_keys()` an
-- ambiguous call, which is what the application issues.
-- ---------------------------------------------------------------------------
drop function if exists public.effective_permission_keys();

create function public.effective_permission_keys(p_school uuid default null)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct rp.permission_key
  from public.user_role_assignments ura
  join public.role_permissions rp on rp.role_id = ura.role_id
  join public.profiles p on p.id = ura.user_id
  where ura.user_id = auth.uid()
    and p.is_active
    and (
      ura.school_id is null
      or p_school is null
      or ura.school_id = p_school
    );
$$;

revoke all on function public.effective_permission_keys(uuid) from public, anon;
grant execute on function public.effective_permission_keys(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. N11: Notifications payload column
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column if not exists payload jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 6. N11: Circular targets role key validation
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'circular_targets_role_key_check'
  ) then
    alter table public.circular_targets
      add constraint circular_targets_role_key_check
      check (role_key is null or role_key in ('owner', 'school_admin', 'department_head', 'staff', 'operator', 'auditor'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 7. N11: Operator assignment synchronization trigger
--
-- This trigger is the single writer of `maintenance_requests.assigned_operator_id`
-- for assignment changes. It handles both directions:
--   * a new active assignment sets the operator;
--   * deactivating the assignment that is currently reflected on the request
--     clears it, so a revoked operator stops being the request's owner.
--
-- `saveMaintenanceAssignment` no longer writes that column, which removes the
-- transient window where the request still named the previous operator.
-- ---------------------------------------------------------------------------
create or replace function public.sync_maintenance_request_operator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active then
    update public.maintenance_requests
    set assigned_operator_id = new.operator_id,
        updated_at = now()
    where id = new.request_id;
  else
    update public.maintenance_requests
    set assigned_operator_id = null,
        updated_at = now()
    where id = new.request_id
      and assigned_operator_id = new.operator_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_maintenance_assignment on public.maintenance_assignments;
create trigger trg_sync_maintenance_assignment
after insert or update of is_active, operator_id on public.maintenance_assignments
for each row execute function public.sync_maintenance_request_operator();
