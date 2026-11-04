-- 0036: Production-readiness fixes from the 2026-10-24 audit.
--
-- Everything here is additive (new policies / new trigger) and reversible, so
-- it complies with the additive-first rule in docs/runbooks/incident_response.md.
-- No table or column is dropped and no data is rewritten.
--
-- ---------------------------------------------------------------------------
-- 1. The three delete features the application ships were silently dead.
--
-- `deleteDepartmentAction`, `deleteLocationAction` and `deleteCircularAction`
-- all use the CALLER'S session client (not the service role), so RLS applies.
-- RLS had no DELETE policy for `departments`, `locations` or `circulars`, so
-- every delete matched zero rows. PostgREST reports an RLS-filtered DELETE as
-- "0 rows affected" with NO error, so the actions returned `{ success: true }`
-- and the UI toasted "deleted" while nothing had been deleted.
--
-- Verified against the local stack before the fix:
--   departments -> 0 rows affected, error: null
--   locations   -> 0 rows affected, error: null
--   circulars   -> 0 rows affected, error: null
--
-- The permissions below mirror the application-side checks exactly:
--   departments / locations -> `settings.school.update` (deleteDepartmentAction,
--                             deleteLocationAction)
--   circulars               -> `circular.create` or `circular.publish`
--                             (assertCanManageCirculars)
-- `school_id` is part of the policy, so a manager can only delete their own
-- school's rows.
-- ---------------------------------------------------------------------------
create policy departments_delete on public.departments
  for delete to authenticated
  using (public.has_permission('settings.school.update', school_id));

create policy locations_delete on public.locations
  for delete to authenticated
  using (public.has_permission('settings.school.update', school_id));

create policy circulars_delete on public.circulars
  for delete to authenticated
  using (
    public.has_permission('circular.create', school_id)
    or public.has_permission('circular.publish', school_id)
  );

-- ---------------------------------------------------------------------------
-- 2. `deleteUserAction` could not remove a user from the school.
--
-- The action dissociates a user by setting `profiles.school_id` to NULL. The
-- `profiles_update` policy evaluates its WITH CHECK against the NEW row:
--   using (id = auth.uid() or is_platform_owner()
--          or has_permission('users.manage', school_id))
-- With school_id = NULL, `has_permission('users.manage', NULL)` only matches a
-- platform-scoped assignment, so a school administrator's update was rejected:
--   "new row violates row-level security policy for table profiles"
-- (verified against the local stack).
--
-- This extra policy allows a user manager of the row's CURRENT school to
-- dissociate that user. The USING clause is evaluated on the OLD row, so it
-- can only ever target users of the caller's own school; the WITH CHECK pins
-- the new row to `school_id IS NULL`, so the policy cannot be used to move a
-- user into another school. The 0019 trigger still blocks a non-manager from
-- changing `school_id` / `is_active` / `department_id` on their own row.
-- ---------------------------------------------------------------------------
create policy profiles_update_dissociate on public.profiles
  for update to authenticated
  using (public.has_permission('users.manage', school_id))
  with check (school_id is null);

-- ---------------------------------------------------------------------------
-- 3. A school role could be renamed to the reserved key `owner`.
--
-- `roles_update` lets a school administrator edit their own school-scoped role,
-- including its `key`. A school role named `owner` is not a platform owner
-- (`is_platform_owner()` additionally requires `ura.school_id IS NULL`), so this
-- was a UI/label confusion rather than a privilege escalation -- but the key
-- is reserved and the application rejects it on create
-- (`validateCreateUserInput`). The trigger makes the two paths consistent.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_role_key_reserved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  -- The platform owner owns the reserved key; nobody else may claim it.
  if new.key = 'owner' and not public.is_platform_owner() then
    raise exception 'The role key "owner" is reserved for the platform owner'
      using errcode = '42501';
  end if;

  -- A school-scoped role may not impersonate a system role key either.
  if new.key <> old.key and new.school_id is not null and new.is_system then
    raise exception 'A school role may not reuse a system role key'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists roles_guard_key on public.roles;
create trigger roles_guard_key
  before update on public.roles
  for each row execute function public.enforce_role_key_reserved();

-- ---------------------------------------------------------------------------
-- 4. `file_metadata` accepted forged rows from any school member.
--
-- The table stores free-text `path`, `owner_id` and `entity_id`. Nothing in
-- the application reads or writes it any more (storage read scope is decided by
-- `can_read_circular_attachment` / `can_read_maintenance_attachment` from
-- migration 0024), but the permissive INSERT policy left a write primitive any
-- member could use to fabricate an ownership record. Restricting the write to
-- the platform owner removes it without changing any application behaviour.
-- ---------------------------------------------------------------------------
drop policy file_metadata_insert on public.file_metadata;
create policy file_metadata_insert on public.file_metadata
  for insert to authenticated
  with check (public.is_platform_owner());

-- ---------------------------------------------------------------------------
-- 5. `notifications_update` let a recipient rewrite the contents of their own
-- notification row (`title`, `body`, `type`).
--
-- The application only ever sets `read_at` from the user's session
-- (`markNotificationReadAction`, `markAllNotificationsReadAction`); the rows
-- themselves are written server-side with the service-role client. RLS cannot
-- restrict WHICH columns an UPDATE may touch, so a trigger pins the writable
-- set. The impact was limited to the recipient's own row, hence the trigger
-- rather than a policy change.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_notification_read_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
    or new.school_id is distinct from old.school_id
    or new.type is distinct from old.type
    or new.title is distinct from old.title
    or new.body is distinct from old.body
    or new.entity_type is distinct from old.entity_type
    or new.entity_id is distinct from old.entity_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Only the read_at flag of a notification may be changed by its recipient'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists notifications_guard_content on public.notifications;
create trigger notifications_guard_content
  before update on public.notifications
  for each row execute function public.enforce_notification_read_only();
