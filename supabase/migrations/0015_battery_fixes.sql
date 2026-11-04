-- 0015: Fixes surfaced by the RLS battery (run 1: 33/40).
-- 1) Department-scoped report readers (department heads) were locked out of
--    maintenance visibility: permission checks ignored the row's department.
-- 2) The last-admin guard blocked FK cascade deletes (school/user removal);
--    it now applies only to explicit, non-cascaded deletes.

-- 1a) Maintenance request visibility for department heads.
drop policy maintenance_requests_select on public.maintenance_requests;
create policy maintenance_requests_select on public.maintenance_requests
  for select to authenticated
  using (
    reporter_id = auth.uid()
    or assigned_operator_id = auth.uid()
    or public.has_permission('maintenance.assign', school_id)
    or public.has_permission('maintenance.close', school_id)
    or public.has_permission('reports.view', school_id, reporter_department_id)
  );

-- 1b) Work-history visibility and authoring follow the same department scope.
drop policy maintenance_updates_select on public.maintenance_updates;
create policy maintenance_updates_select on public.maintenance_updates
  for select to authenticated
  using (
    exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and (
          m.reporter_id = auth.uid()
          or m.assigned_operator_id = auth.uid()
          or public.has_permission('maintenance.update', m.school_id, m.reporter_department_id)
          or public.has_permission('maintenance.assign', m.school_id, m.reporter_department_id)
        )
    )
  );

drop policy maintenance_updates_insert on public.maintenance_updates;
create policy maintenance_updates_insert on public.maintenance_updates
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and (
          m.reporter_id = auth.uid()
          or m.assigned_operator_id = auth.uid()
          or public.has_permission('maintenance.update', m.school_id, m.reporter_department_id)
          or public.has_permission('maintenance.assign', m.school_id, m.reporter_department_id)
        )
    )
  );

drop policy maintenance_attachments_select on public.maintenance_attachments;
create policy maintenance_attachments_select on public.maintenance_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and (
          m.reporter_id = auth.uid()
          or m.assigned_operator_id = auth.uid()
          or public.has_permission('maintenance.assign', m.school_id, m.reporter_department_id)
          or public.has_permission('maintenance.update', m.school_id, m.reporter_department_id)
        )
    )
  );

drop policy maintenance_attachments_insert on public.maintenance_attachments;
create policy maintenance_attachments_insert on public.maintenance_attachments
  for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and (
          m.reporter_id = auth.uid()
          or m.assigned_operator_id = auth.uid()
          or public.has_permission('maintenance.assign', m.school_id, m.reporter_department_id)
          or public.has_permission('maintenance.update', m.school_id, m.reporter_department_id)
        )
    )
  );

-- 2) Cascade deletes (school removal, user deletion) must not trip the
--    last-admin guard; explicit single-row deletes keep full protection.
create or replace function public.enforce_assignment_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid;
  v_school uuid;
  v_role_key text;
  v_removed_id uuid;
begin
  if tg_op = 'DELETE' then
    v_target := old.user_id;
    v_school := old.school_id;
    v_removed_id := old.id;
    select r.key into v_role_key from public.roles r where r.id = old.role_id;
  else
    v_target := new.user_id;
    v_school := new.school_id;
    v_removed_id := old.id;
    select r.key into v_role_key from public.roles r where r.id = new.role_id;
  end if;

  if auth.uid() = v_target and not public.is_platform_owner() and public.has_any_owner() then
    raise exception 'Users cannot modify their own role assignments';
  end if;

  if v_school is null and not public.is_platform_owner() and public.has_any_owner() then
    raise exception 'Only the platform owner can manage platform-level roles';
  end if;

  -- pg_trigger_depth() > 1 means the delete arrived through an FK cascade
  -- (school or user removal) rather than an explicit operator action.
  if pg_trigger_depth() <= 1
    and (
      tg_op = 'DELETE'
      or (
        tg_op = 'UPDATE'
        and (
          old.user_id is distinct from new.user_id
          or old.role_id is distinct from new.role_id
          or old.school_id is distinct from new.school_id
        )
      )
    )
  then
    if v_role_key = 'owner' and v_school is null and not exists (
      select 1
      from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      join public.profiles p on p.id = ura.user_id
      where r.key = 'owner'
        and ura.school_id is null
        and p.is_active
        and ura.id is distinct from v_removed_id
    ) then
      raise exception 'Cannot remove the last active platform owner';
    end if;

    if v_role_key = 'school_admin' and v_school is not null and not exists (
      select 1
      from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      join public.profiles p on p.id = ura.user_id
      where r.key = 'school_admin'
        and ura.school_id = v_school
        and p.is_active
        and ura.id is distinct from v_removed_id
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
