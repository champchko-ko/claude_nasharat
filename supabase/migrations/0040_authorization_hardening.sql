-- 0040: Authorization hardening from the 2026-10-28 production-readiness audit.
--
-- Forward-only. Nothing here drops a table or a column. It closes four
-- escalation paths that were confirmed against the local stack:
--
--   B-1  a school admin could insert a school-scoped role keyed "owner" (the
--        reserved-key trigger only fired on UPDATE) and then be treated as a
--        platform owner by app code that matches roles.key without checking
--        school_id.
--   B-3  a manager could move their own profiles.school_id to another tenant
--        and then read that tenant's user directory through a service-role
--        query.
--   H-10 settings.platform.update could be attached to a school custom role.
--   H-11 a circular.create-only role could publish/archive, and a demoted
--        creator kept edit rights through `created_by = auth.uid()`.
--
-- It also repairs the shadowed-column bug in assignments_insert, adds the
-- missing circular_targets DELETE policy, and enforces circular status
-- transitions in the database instead of only in the UI.

-- ---------------------------------------------------------------------------
-- 1. Reserved role keys: guard INSERT as well as UPDATE.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_role_key_reserved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Migrations and service-role tooling run without an end-user identity.
  -- Every end-user path must be blocked, on insert as well as update.
  if auth.uid() is not null and new.key in ('owner', 'platform_owner') then
    raise exception 'The role key "%" is reserved for the platform owner', new.key
      using errcode = '42501';
  end if;

  if new.school_id is not null and new.is_system then
    raise exception 'A school-scoped role cannot be a system role'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists roles_guard_key on public.roles;
create trigger roles_guard_key
  before insert or update on public.roles
  for each row execute function public.enforce_role_key_reserved();

-- Remove any school-scoped reserved-key role created before this fix, together
-- with its assignments and permissions. Such rows are never legitimate.
delete from public.user_role_assignments ura
using public.roles r
where ura.role_id = r.id
  and r.school_id is not null
  and r.key in ('owner', 'platform_owner');

delete from public.role_permissions rp
using public.roles r
where rp.role_id = r.id
  and r.school_id is not null
  and r.key in ('owner', 'platform_owner');

delete from public.roles r
where r.school_id is not null
  and r.key in ('owner', 'platform_owner');

alter table public.roles
  drop constraint if exists roles_reserved_key_check;
alter table public.roles
  add constraint roles_reserved_key_check
  check (school_id is null or key not in ('owner', 'platform_owner'));

-- ---------------------------------------------------------------------------
-- 2. Role assignments are user management, not role-catalog management.
--    `roles.manage` no longer grants them, the ROLE's tenant is validated, and
--    the target user's school comparison is now a real one (assignments_update
--    still contained the `p.school_id = p.school_id` tautology).
-- ---------------------------------------------------------------------------
drop policy if exists assignments_insert on public.user_role_assignments;
create policy assignments_insert on public.user_role_assignments
  for insert to authenticated
  with check (
    (public.is_platform_owner() or public.has_permission('users.manage', school_id))
    and exists (
      select 1
      from public.roles r
      where r.id = user_role_assignments.role_id
        and (r.school_id is null or r.school_id = user_role_assignments.school_id)
        and (r.key <> 'owner' or public.is_platform_owner())
    )
    and exists (
      select 1
      from public.profiles p
      where p.id = user_role_assignments.user_id
        and (
          user_role_assignments.school_id is null
          or p.school_id = user_role_assignments.school_id
        )
    )
    and (assigned_by is null or assigned_by = auth.uid())
  );

drop policy if exists assignments_update on public.user_role_assignments;
create policy assignments_update on public.user_role_assignments
  for update to authenticated
  using (
    public.is_platform_owner() or public.has_permission('users.manage', school_id)
  )
  with check (
    (public.is_platform_owner() or public.has_permission('users.manage', school_id))
    and exists (
      select 1
      from public.roles r
      where r.id = user_role_assignments.role_id
        and (r.school_id is null or r.school_id = user_role_assignments.school_id)
        and (r.key <> 'owner' or public.is_platform_owner())
    )
    and exists (
      select 1
      from public.profiles p
      where p.id = user_role_assignments.user_id
        and (
          user_role_assignments.school_id is null
          or p.school_id = user_role_assignments.school_id
        )
    )
    and (assigned_by is null or assigned_by = auth.uid())
  );

drop policy if exists assignments_delete on public.user_role_assignments;
create policy assignments_delete on public.user_role_assignments
  for delete to authenticated
  using (
    public.is_platform_owner() or public.has_permission('users.manage', school_id)
  );

-- ---------------------------------------------------------------------------
-- 3. A user may never move themselves between schools or departments.
--    This runs before the manager exemption, so it also covers a school admin
--    editing their own profile.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role / migration / seed context: no end-user identity, no limit.
  if auth.uid() is null then
    return new;
  end if;

  -- New in 0040: tenant membership is never self-service, not even for a
  -- manager. Moving a profile between schools is a platform-owner action.
  if old.id = auth.uid() then
    if new.school_id is distinct from old.school_id then
      raise exception 'profiles: you cannot change your own school'
        using errcode = '42501';
    end if;
    if new.department_id is distinct from old.department_id then
      raise exception 'profiles: you cannot change your own department'
        using errcode = '42501';
    end if;
  end if;

  if old.is_active and not new.is_active then
    if exists (
      select 1
      from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      where ura.user_id = old.id and r.key = 'owner' and ura.school_id is null
    ) and not exists (
      select 1
      from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      join public.profiles p on p.id = ura.user_id
      where r.key = 'owner' and ura.school_id is null
        and p.is_active and ura.user_id <> old.id
    ) then
      raise exception 'Cannot deactivate the last active platform owner'
        using errcode = '42501';
    end if;

    if old.school_id is not null
      and exists (
        select 1
        from public.user_role_assignments ura
        join public.roles r on r.id = ura.role_id
        where ura.user_id = old.id and r.key = 'school_admin'
          and ura.school_id = old.school_id
      )
      and not exists (
        select 1
        from public.user_role_assignments ura
        join public.roles r on r.id = ura.role_id
        join public.profiles p on p.id = ura.user_id
        where r.key = 'school_admin' and ura.school_id = old.school_id
          and p.is_active and ura.user_id <> old.id
      ) then
      raise exception 'Cannot deactivate the last active school administrator'
        using errcode = '42501';
    end if;
  end if;

  -- Managers and the platform owner may change anything the RLS policies
  -- already allow them to change.
  if public.is_platform_owner()
    or public.has_permission('users.manage', old.school_id)
    or public.has_permission('users.manage', new.school_id) then
    return new;
  end if;

  -- Everyone else is limited to a self-service profile edit.
  if new.is_active is distinct from old.is_active
    or new.school_id is distinct from old.school_id
    or new.department_id is distinct from old.department_id then
    raise exception
      'profiles: is_active, school_id and department_id may only be changed by a user manager'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. The system role catalog stays readable to managers, except the owner row.
-- ---------------------------------------------------------------------------
drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
  for select to authenticated
  using (
    public.is_platform_owner()
    or (
      school_id is not null
      and (
        public.has_permission('roles.manage', school_id)
        or public.has_permission('users.manage', school_id)
      )
    )
    or (is_system and key <> 'owner' and public.can_read_system_roles())
  );

-- ---------------------------------------------------------------------------
-- 5. Platform-only permission keys cannot be attached to a school role, and a
--    role manager cannot rewrite the permissions of a role they hold
--    themselves. Without the second rule a `roles.manage`-only user could add
--    `users.manage` to their own role and escalate (the implicit link is gone,
--    but the explicit self-grant would remain).
-- ---------------------------------------------------------------------------
drop policy if exists role_permissions_write on public.role_permissions;
create policy role_permissions_write on public.role_permissions
  for all to authenticated
  using (
    public.is_platform_owner()
    or (
      role_permissions.permission_key not like 'settings.platform.%'
      and exists (
        select 1
        from public.roles r
        where r.id = role_permissions.role_id
          and r.school_id is not null
          and not r.is_system
          and public.has_permission('roles.manage', r.school_id)
      )
      and not exists (
        select 1
        from public.user_role_assignments ura
        where ura.role_id = role_permissions.role_id
          and ura.user_id = auth.uid()
      )
    )
  )
  with check (
    public.is_platform_owner()
    or (
      role_permissions.permission_key not like 'settings.platform.%'
      and exists (
        select 1
        from public.roles r
        where r.id = role_permissions.role_id
          and r.school_id is not null
          and not r.is_system
          and public.has_permission('roles.manage', r.school_id)
      )
      and not exists (
        select 1
        from public.user_role_assignments ura
        where ura.role_id = role_permissions.role_id
          and ura.user_id = auth.uid()
      )
    )
  );

-- Remove any platform key that already leaked into a school-scoped role.
delete from public.role_permissions rp
using public.roles r
where rp.role_id = r.id
  and r.school_id is not null
  and rp.permission_key like 'settings.platform.%';

-- ---------------------------------------------------------------------------
-- 6. Circular edits require a circular permission; the creator shortcut is gone.
-- ---------------------------------------------------------------------------
drop policy if exists circulars_update on public.circulars;
create policy circulars_update on public.circulars
  for update to authenticated
  using (
    public.has_permission('circular.create', school_id)
    or public.has_permission('circular.publish', school_id)
  )
  with check (
    public.has_permission('circular.create', school_id)
    or public.has_permission('circular.publish', school_id)
  );

-- Publishing, archiving and cancelling require circular.publish even when the
-- caller holds circular.create.
create or replace function public.enforce_circular_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status in ('published', 'archived', 'cancelled')
      and not public.has_permission('circular.publish', new.school_id) then
      raise exception 'Publishing, archiving or cancelling a circular requires circular.publish'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status
    and new.status in ('published', 'archived', 'cancelled')
    and not public.has_permission('circular.publish', new.school_id) then
    raise exception 'Publishing, archiving or cancelling a circular requires circular.publish'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists circulars_status_guard on public.circulars;
create trigger circulars_status_guard
  before insert or update on public.circulars
  for each row execute function public.enforce_circular_status_transition();

-- ---------------------------------------------------------------------------
-- 7. circular_targets: missing DELETE policy and missing uniqueness.
--    Editing a circular deletes then re-inserts targets; without a DELETE
--    policy the delete silently matched zero rows.
-- ---------------------------------------------------------------------------
drop policy if exists circular_targets_delete on public.circular_targets;
create policy circular_targets_delete on public.circular_targets
  for delete to authenticated
  using (
    exists (
      select 1
      from public.circulars c
      where c.id = circular_targets.circular_id
        and (
          public.has_permission('circular.create', c.school_id)
          or public.has_permission('circular.publish', c.school_id)
        )
    )
  );

-- Collapse exact duplicates before adding the constraint.
delete from public.circular_targets a
using public.circular_targets b
where a.ctid < b.ctid
  and a.circular_id = b.circular_id
  and a.department_id is not distinct from b.department_id
  and a.role_key is not distinct from b.role_key;

alter table public.circular_targets
  drop constraint if exists circular_targets_unique_target;
alter table public.circular_targets
  add constraint circular_targets_unique_target
  unique nulls not distinct (circular_id, department_id, role_key);
