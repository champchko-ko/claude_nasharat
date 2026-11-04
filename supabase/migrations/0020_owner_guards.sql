-- 0020: Close the owner privilege-escalation chain (H6 -> H2) and the owner
-- lockout paths (N4).
--
-- H6: `enforce_assignment_integrity` read the role from the NEW row on UPDATE,
-- so changing an assignment `owner -> school_admin` removed the last owner
-- without tripping the guard; `has_any_owner()` then reported `false`, which
-- disabled the self-grant guard and let any authenticated user call the unbound
-- bootstrap RPC. The guard now evaluates the OLD row - the assignment actually
-- being removed or changed away from.
--
-- H2: `bootstrap_platform_owner` never checked that `p_user_id` was the caller,
-- so any signed-in user could bootstrap an arbitrary account. It is now bound
-- to `auth.uid()` and requires an active profile.
--
-- N4: the last active platform owner / school administrator can no longer be
-- deactivated through a profile update (which would strand the platform with an
-- owner row that no active profile backs).

create or replace function public.enforce_assignment_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_old_role_key text;
  v_old_id uuid;
  v_old_school uuid;
  v_is_removal boolean;
begin
  -- OLD is unavailable on INSERT and NEW on DELETE; normalise both to jsonb so
  -- a single code path can inspect the row that is actually being written.
  v_old := case when tg_op <> 'INSERT' then to_jsonb(old) else to_jsonb(new) end;
  v_new := case when tg_op <> 'DELETE' then to_jsonb(new) else to_jsonb(old) end;

  v_old_id := (v_old ->> 'id')::uuid;
  v_old_school := (v_old ->> 'school_id')::uuid;
  select r.key into v_old_role_key
  from public.roles r
  where r.id = (v_old ->> 'role_id')::uuid;

  -- Self-service and platform-level writes are bound to end-user requests
  -- (auth.uid() set). Service-role / server tooling (bootstrap cleanup, user
  -- deletion) is trusted and must not be blocked here. The `has_any_owner()`
  -- exception exists only so the very first platform owner can be bootstrapped.
  if auth.uid() is not null
    and not public.is_platform_owner()
    and public.has_any_owner() then
    if auth.uid() = (v_old ->> 'user_id')::uuid
      or auth.uid() = (v_new ->> 'user_id')::uuid then
      raise exception 'Users cannot modify their own role assignments';
    end if;

    if (v_old ->> 'school_id') is null or (v_new ->> 'school_id') is null then
      raise exception 'Only the platform owner can manage platform-level roles';
    end if;
  end if;

  -- A removal is any delete, or an update that rebinds the assignment's
  -- identity/scope. The last-owner / last-admin guards must look at the OLD
  -- row, never the new one.
  v_is_removal := tg_op = 'DELETE'
    or (
      tg_op = 'UPDATE'
      and (
        (v_old ->> 'user_id') is distinct from (v_new ->> 'user_id')
        or (v_old ->> 'role_id') is distinct from (v_new ->> 'role_id')
        or (v_old ->> 'school_id') is distinct from (v_new ->> 'school_id')
      )
    );

  -- pg_trigger_depth() > 1 means the removal arrived through an FK cascade
  -- (school or user deletion) rather than an explicit operator action.
  -- A null auth.uid() is the service-role / server context: trusted tooling
  -- (user deletion, fixture teardown) must still be able to remove the last
  -- owner, while an end-user REST call is always bound to a JWT subject.
  if v_is_removal and pg_trigger_depth() <= 1 and auth.uid() is not null then
    if v_old_role_key = 'owner' and v_old_school is null and not exists (
      select 1
      from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      join public.profiles p on p.id = ura.user_id
      where r.key = 'owner'
        and ura.school_id is null
        and p.is_active
        and ura.id is distinct from v_old_id
    ) then
      raise exception 'Cannot remove the last active platform owner';
    end if;

    if v_old_role_key = 'school_admin' and v_old_school is not null and not exists (
      select 1
      from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      join public.profiles p on p.id = ura.user_id
      where r.key = 'school_admin'
        and ura.school_id = v_old_school
        and p.is_active
        and ura.id is distinct from v_old_id
    ) then
      raise exception 'Cannot remove the last active school administrator';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- H2: bind the bootstrap to the calling user and require an active profile.
create or replace function public.bootstrap_platform_owner(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_any_owner() then
    raise exception 'Platform owner already exists';
  end if;
  if p_user_id is distinct from auth.uid() then
    raise exception 'A user may only bootstrap the platform owner role for themselves';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id and is_active) then
    raise exception 'Profile does not exist or is inactive for the bootstrap user';
  end if;
  insert into public.user_role_assignments (user_id, role_id, school_id)
  select p_user_id, r.id, null
  from public.roles r
  where r.key = 'owner' and r.school_id is null;
end;
$$;

-- N4: the last active owner / school administrator cannot be deactivated.
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
