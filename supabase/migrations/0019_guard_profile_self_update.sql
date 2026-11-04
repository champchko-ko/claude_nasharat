-- 0019: Close the disabled-user self-reactivation path (finding N1) and the
-- self-service scope rewrite (finding H4).
--
-- `profiles_update` grants unrestricted column writes on the caller's own row,
-- so a deactivated user could PATCH `is_active = true`, and any user could
-- rewrite their own `school_id` / `department_id` to reach another tenant's
-- data (is_circular_target resolves targeting from `profiles.department_id`).
-- RLS cannot compare against the OLD row, so the protection is a BEFORE UPDATE
-- trigger: platform owners and `users.manage` holders keep full control; every
-- other caller may edit their own row but not the protected columns.

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

drop trigger if exists profiles_guard_self_update on public.profiles;
create trigger profiles_guard_self_update
  before update on public.profiles
  for each row execute function public.enforce_profile_self_update();
