-- 0046: removing a user from a school is a single, guarded operation
-- (finding M-10).
--
-- `deleteUserAction` used the service-role client, so it bypassed both:
--   * `enforce_profile_self_update()` (the last-active-admin guard), because
--     that trigger returns early when `auth.uid()` is null; and
--   * the `profiles_update_dissociate` WITH CHECK that requires the new row to
--     have `school_id IS NULL` exactly.
-- It also deleted the role assignments first, so a later failure left the user
-- active with no school and no roles.
--
-- This migration adds:
--   1. `is_last_active_school_admin(user)` ? a single definition of "the school
--      would lose its last administrator", used by the app and the trigger.
--   2. `dissociate_school_user(user)` ? the whole removal in one transaction,
--      executed with the caller's identity (so permissions are real).
--   3. A trigger that keeps every other dissociation path honest: a profile
--      cannot leave a school while staying active, and the last active
--      administrator cannot be removed through the direct API either.

-- ---------------------------------------------------------------------------
-- 1. Is this user the school's last active school administrator?
-- ---------------------------------------------------------------------------
create or replace function public.is_last_active_school_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with target as (
    select p.id, p.school_id
    from public.profiles p
    where p.id = p_user_id
      and p.is_active
      and p.school_id is not null
      and exists (
        select 1
        from public.user_role_assignments ura
        join public.roles r on r.id = ura.role_id
        where ura.user_id = p.id
          and ura.school_id = p.school_id
          and r.key = 'school_admin'
      )
  )
  select
    exists (select 1 from target)
    and not exists (
      select 1
      from public.profiles other
      join public.user_role_assignments ura
        on ura.user_id = other.id and ura.school_id = other.school_id
      join public.roles r on r.id = ura.role_id and r.key = 'school_admin'
      join target t on t.school_id = other.school_id
      where other.is_active
        and other.id <> t.id
    );
$$;

revoke all on function public.is_last_active_school_admin(uuid) from public, anon;
grant execute on function public.is_last_active_school_admin(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Atomic dissociation.
--
-- Runs as the caller: `auth.uid()` is the administrator, so `has_permission`
-- evaluates their real assignments. The function is SECURITY DEFINER only so
-- it can perform the two writes consistently after the checks; it never trusts
-- a school id supplied by the caller (it reads the target's school).
-- ---------------------------------------------------------------------------
create or replace function public.dissociate_school_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_school uuid;
  v_active boolean;
  v_rows integer;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select p.school_id, p.is_active
    into v_school, v_active
  from public.profiles p
  where p.id = p_user_id;

  if v_school is null then
    raise exception 'User not found in this school' using errcode = 'P0002';
  end if;

  if not public.has_permission('users.manage', v_school) then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  if p_user_id = v_actor then
    raise exception 'Cannot remove your own account' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = p_user_id
      and ura.school_id is null
      and r.key = 'owner'
  ) then
    raise exception 'Cannot modify system-protected account' using errcode = '42501';
  end if;

  if v_active and public.is_last_active_school_admin(p_user_id) then
    raise exception 'Cannot remove the last active school administrator'
      using errcode = '42501';
  end if;

  delete from public.user_role_assignments
  where user_id = p_user_id
    and school_id = v_school;

  update public.profiles
  set school_id = null,
      department_id = null,
      is_active = false,
      updated_at = now()
  where id = p_user_id
    and school_id = v_school;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'User not found in this school' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.dissociate_school_user(uuid) from public, anon;
grant execute on function public.dissociate_school_user(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Every dissociation path must deactivate, and must respect the guard.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_dissociation_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Trusted service-role / restore context: `dissociate_school_user` already
  -- ran the guard with the caller's identity. A trigger depth above 1 means
  -- the update arrived through an FK cascade (deleting the school itself),
  -- which is not a dissociation and is already protected by the school delete
  -- policy (0015 uses the same rule for role assignments).
  if auth.uid() is null or pg_trigger_depth() > 1 then
    return new;
  end if;

  if old.school_id is not null and new.school_id is null then
    if new.is_active then
      raise exception 'A user removed from a school must be deactivated'
        using errcode = '42501';
    end if;

    if public.is_last_active_school_admin(old.id) then
      raise exception 'Cannot remove the last active school administrator'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_dissociation_guard on public.profiles;
create trigger profiles_dissociation_guard
  before update on public.profiles
  for each row execute function public.enforce_dissociation_consistency();
