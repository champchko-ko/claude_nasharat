-- 0022: Constrain write scope on maintenance and circular child rows.
--
-- M7  new maintenance requests must start 'submitted' and unassigned.
-- H5  a reporter rewriting their ticket could relocate it to another tenant,
--     escalate priority, implicate an arbitrary operator and forge closure
--     evidence. Identity/scope columns are now pinned outside the manager path.
-- H8  a response could be filed for an arbitrary department (a school-scoped
--     assignment is a wildcard for `has_permission`) and for a circular the
--     caller is not targeted by.
-- H9  child rows accepted a parent id from another school while claiming the
--     caller's own school; parents are now required to match the row's school.
-- H10 a school manager could grant a role to a user from another school.

-- ---------------------------------------------------------------------------
-- M7: transition machine also covers INSERT (only 'submitted' is legal) and
-- the insert policy pins status + assignment.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_maintenance_transition()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status is distinct from 'submitted' then
      raise exception 'New maintenance requests must start in submitted status';
    end if;
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'submitted' and new.status in ('triaged', 'assigned', 'rejected'))
    or (old.status = 'triaged' and new.status = 'assigned')
    or (old.status = 'assigned' and new.status in ('in_progress', 'waiting_for_parts'))
    or (old.status = 'in_progress' and new.status in ('waiting_for_parts', 'resolved'))
    or (old.status = 'waiting_for_parts' and new.status = 'in_progress')
    or (old.status = 'resolved' and new.status in ('closed', 'reopened'))
    or (old.status = 'closed' and new.status = 'reopened')
    or (old.status = 'reopened' and new.status in ('assigned', 'in_progress'))
  ) then
    raise exception 'Illegal maintenance status transition % -> %', old.status, new.status;
  end if;

  if new.first_response_at is null then
    new.first_response_at := now();
  end if;
  if new.status = 'resolved' then
    new.resolved_at := now();
  end if;
  if new.status = 'closed' then
    new.closed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists maintenance_requests_transition on public.maintenance_requests;
create trigger maintenance_requests_transition
  before insert or update on public.maintenance_requests
  for each row execute function public.enforce_maintenance_transition();

drop policy maintenance_requests_insert on public.maintenance_requests;
create policy maintenance_requests_insert on public.maintenance_requests
  for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and public.has_permission('maintenance.create', school_id)
    and status = 'submitted'
    and assigned_operator_id is null
  );

-- ---------------------------------------------------------------------------
-- H5: pin identity/scope columns; only a reporter reopening their own ticket
-- (or a maintenance manager) may move state/priority/assignment.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_maintenance_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  -- Maintenance managers may change anything the RLS policies allow.
  if public.has_permission('maintenance.assign', old.school_id)
    or public.has_permission('maintenance.close', old.school_id) then
    return new;
  end if;

  -- A reporter (who is not also an operator/updater) may only reopen a
  -- resolved or closed request - nothing else on the row may change.
  if auth.uid() = old.reporter_id
    and not public.has_permission('maintenance.update', old.school_id) then
    if new.school_id is distinct from old.school_id
      or new.reporter_id is distinct from old.reporter_id
      or new.reporter_department_id is distinct from old.reporter_department_id
      or new.ticket_number is distinct from old.ticket_number
      or new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.category is distinct from old.category
      or new.location_id is distinct from old.location_id
      or new.priority is distinct from old.priority
      or new.assigned_operator_id is distinct from old.assigned_operator_id
      or new.closed_by is distinct from old.closed_by
      or new.resolved_at is distinct from old.resolved_at
      or new.closed_at is distinct from old.closed_at
      or new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'A reporter may only reopen their own request'
        using errcode = '42501';
    end if;
    if new.status is distinct from old.status and not (
      new.status = 'reopened' and old.status in ('resolved', 'closed')
    ) then
      raise exception 'A reporter may only reopen a resolved or closed request'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- Operators and other permitted updaters may move status/notes but not
  -- change the request's identity, tenant, department, priority or assignee.
  if new.school_id is distinct from old.school_id
    or new.reporter_id is distinct from old.reporter_id
    or new.reporter_department_id is distinct from old.reporter_department_id
    or new.ticket_number is distinct from old.ticket_number
    or new.priority is distinct from old.priority
    or new.assigned_operator_id is distinct from old.assigned_operator_id
    or new.rejection_reason is distinct from old.rejection_reason then
    raise exception 'Maintenance scope fields may only be changed by a maintenance manager'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists maintenance_requests_scope on public.maintenance_requests;
create trigger maintenance_requests_scope
  before update on public.maintenance_requests
  for each row execute function public.enforce_maintenance_update_scope();

-- ---------------------------------------------------------------------------
-- H9: a circular's tenant must not be movable through an update.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_circular_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_platform_owner() then
    return new;
  end if;
  if new.school_id is distinct from old.school_id
    or new.created_by is distinct from old.created_by
    or new.ref_number is distinct from old.ref_number then
    raise exception 'Circular tenant and identity fields cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists circulars_scope on public.circulars;
create trigger circulars_scope
  before update on public.circulars
  for each row execute function public.enforce_circular_scope();

-- ---------------------------------------------------------------------------
-- H9: circular targets must point at a circular in the same school.
-- ---------------------------------------------------------------------------
drop policy circular_targets_insert on public.circular_targets;
create policy circular_targets_insert on public.circular_targets
  for insert to authenticated
  with check (
    public.has_permission('circular.create', school_id)
    and exists (
      select 1 from public.circulars c
      where c.id = circular_id and c.school_id = school_id
    )
  );
drop policy circular_targets_update on public.circular_targets;
create policy circular_targets_update on public.circular_targets
  for update to authenticated
  using (public.has_permission('circular.create', school_id))
  with check (
    public.has_permission('circular.create', school_id)
    and exists (
      select 1 from public.circulars c
      where c.id = circular_id and c.school_id = school_id
    )
  );

-- ---------------------------------------------------------------------------
-- H8 + H9: responses must target the caller, bind to the caller's department,
-- and reference a circular in the same school.
-- ---------------------------------------------------------------------------
drop policy circular_responses_insert on public.circular_responses;
create policy circular_responses_insert on public.circular_responses
  for insert to authenticated
  with check (
    responder_id = auth.uid()
    and public.has_permission('circular.respond', school_id, department_id)
    and public.is_circular_target(circular_id)
    and exists (
      select 1 from public.circulars c
      where c.id = circular_id and c.school_id = school_id
    )
    and exists (
      select 1 from public.user_role_assignments ura
      where ura.user_id = auth.uid()
        and ura.school_id = school_id
        and ura.department_id = department_id
    )
  );
drop policy circular_responses_update on public.circular_responses;
create policy circular_responses_update on public.circular_responses
  for update to authenticated
  using (
    responder_id = auth.uid()
    and public.has_permission('circular.respond', school_id, department_id)
    and exists (
      select 1 from public.circulars c
      where c.id = circular_id and c.allow_response_revision
    )
  )
  with check (
    responder_id = auth.uid()
    and public.has_permission('circular.respond', school_id, department_id)
    and exists (
      select 1 from public.circulars c
      where c.id = circular_id and c.school_id = school_id
    )
  );

-- ---------------------------------------------------------------------------
-- H9: circular attachments must point at a circular in the same school.
-- ---------------------------------------------------------------------------
drop policy circular_attachments_insert on public.circular_attachments;
create policy circular_attachments_insert on public.circular_attachments
  for insert to authenticated
  with check (
    public.has_permission('circular.create', school_id)
    and exists (
      select 1 from public.circulars c
      where c.id = circular_id and c.school_id = school_id
    )
  );

-- ---------------------------------------------------------------------------
-- H9: maintenance child rows must point at a request in the same school.
-- ---------------------------------------------------------------------------
drop policy maintenance_updates_insert on public.maintenance_updates;
create policy maintenance_updates_insert on public.maintenance_updates
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id
        and m.school_id = school_id
        and (
          m.reporter_id = auth.uid()
          or m.assigned_operator_id = auth.uid()
          or public.has_permission('maintenance.update', m.school_id, m.reporter_department_id)
          or public.has_permission('maintenance.assign', m.school_id, m.reporter_department_id)
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
        and m.school_id = school_id
        and (
          m.reporter_id = auth.uid()
          or m.assigned_operator_id = auth.uid()
          or public.has_permission('maintenance.assign', m.school_id, m.reporter_department_id)
          or public.has_permission('maintenance.update', m.school_id, m.reporter_department_id)
        )
    )
  );

drop policy maintenance_assignments_insert on public.maintenance_assignments;
create policy maintenance_assignments_insert on public.maintenance_assignments
  for insert to authenticated
  with check (
    public.has_permission('maintenance.assign', school_id)
    and exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id and m.school_id = school_id
    )
  );
drop policy maintenance_assignments_update on public.maintenance_assignments;
create policy maintenance_assignments_update on public.maintenance_assignments
  for update to authenticated
  using (public.has_permission('maintenance.assign', school_id))
  with check (
    public.has_permission('maintenance.assign', school_id)
    and exists (
      select 1 from public.maintenance_requests m
      where m.id = request_id and m.school_id = school_id
    )
  );

-- ---------------------------------------------------------------------------
-- H10: a role may only be granted inside the target user's own school, and
-- `assigned_by` cannot be forged.
-- ---------------------------------------------------------------------------
drop policy assignments_insert on public.user_role_assignments;
create policy assignments_insert on public.user_role_assignments
  for insert to authenticated
  with check (
    (
      public.is_platform_owner()
      or public.has_permission('users.manage', school_id)
      or public.has_permission('roles.manage', school_id)
    )
    and exists (
      select 1 from public.profiles p
      where p.id = user_id and (school_id is null or p.school_id = school_id)
    )
    and (assigned_by is null or assigned_by = auth.uid())
  );
drop policy assignments_update on public.user_role_assignments;
create policy assignments_update on public.user_role_assignments
  for update to authenticated
  using (
    public.is_platform_owner()
    or public.has_permission('users.manage', school_id)
    or public.has_permission('roles.manage', school_id)
  )
  with check (
    (
      public.is_platform_owner()
      or public.has_permission('users.manage', school_id)
      or public.has_permission('roles.manage', school_id)
    )
    and exists (
      select 1 from public.profiles p
      where p.id = user_id and (school_id is null or p.school_id = school_id)
    )
  );
