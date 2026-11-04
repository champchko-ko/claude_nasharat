-- 0058: Synchronize department membership between profiles and user_role_assignments,
-- and harden circular response submission and target checks for department heads.
--
-- Problem:
-- When users were assigned department_head (or other department-specific roles),
-- profiles.department_id was recorded, but user_role_assignments.department_id
-- remained null. As a consequence:
-- 1. submit_circular_response failed at Step 2 (ura.department_id = p_department_id)
-- 2. is_circular_target failed to match the department from role assignments
-- 3. circular_responses_insert RLS check rejected response insertion.

-- 1. Backfill existing user role assignments from profiles
update public.user_role_assignments ura
set department_id = p.department_id,
    updated_at = now()
from public.profiles p
where p.id = ura.user_id
  and ura.school_id is not null
  and ura.school_id = p.school_id
  and p.department_id is not null
  and ura.department_id is distinct from p.department_id;

-- 2. Trigger on profiles to automatically propagate department_id changes to user_role_assignments
create or replace function public.sync_profile_department_to_assignments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.school_id is not null and (tg_op = 'INSERT' or new.department_id is distinct from old.department_id) then
    update public.user_role_assignments
    set department_id = new.department_id, updated_at = now()
    where user_id = new.id
      and school_id = new.school_id
      and department_id is distinct from new.department_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_profile_department on public.profiles;
create trigger sync_profile_department
  after insert or update of department_id, school_id on public.profiles
  for each row execute function public.sync_profile_department_to_assignments();

-- 3. Update submit_circular_response to check ura.department_id OR fallback to verified profile
create or replace function public.submit_circular_response(
  p_circular_id uuid,
  p_school_id uuid,
  p_department_id uuid,
  p_response_type public.circular_response_type,
  p_status public.circular_response_status,
  p_reason text default null
)
returns public.circular_responses
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new_row public.circular_responses;
  v_allow_revision boolean;
  v_prev_status public.circular_response_status;
  v_has_existing boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized: must be authenticated'
      using errcode = '42501';
  end if;

  -- 1. Verify caller has permission to respond for this department in this school
  if not public.has_permission('circular.respond', p_school_id, p_department_id) then
    raise exception 'Unauthorized: caller lacks circular.respond permission'
      using errcode = '42501';
  end if;

  -- 2. Verify caller belongs to the department in this school (via assignment or profile)
  if not exists (
    select 1 from public.user_role_assignments ura
    where ura.user_id = auth.uid()
      and ura.school_id = p_school_id
      and (
        ura.department_id = p_department_id
        or (
          ura.department_id is null
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.school_id = p_school_id
              and p.department_id = p_department_id
          )
        )
      )
  ) then
    raise exception 'Unauthorized: caller does not belong to department'
      using errcode = '42501';
  end if;

  -- 3. Verify circular exists, belongs to school, and is published
  select c.allow_response_revision into v_allow_revision
  from public.circulars c
  where c.id = p_circular_id
    and c.school_id = p_school_id
    and c.status = 'published';

  if not found then
    raise exception 'Circular not found or not published'
      using errcode = 'P0002';
  end if;

  -- 4. Verify department is targeted
  if not public.is_circular_target(p_circular_id) then
    raise exception 'Circular is not targeted to this department'
      using errcode = '42501';
  end if;

  -- 5. Check if previous latest response exists
  select status into v_prev_status
  from public.circular_responses
  where circular_id = p_circular_id
    and department_id = p_department_id
    and school_id = p_school_id
    and is_latest = true;

  if found then
    v_has_existing := true;
    -- If previous response was already final (approved/rejected/completed) and revisions not allowed
    if v_prev_status != 'acknowledged' and not coalesce(v_allow_revision, false) then
      raise exception 'Circular does not allow response revisions'
        using errcode = '42501';
    end if;
  end if;

  -- 6. Demote previous latest response
  if v_has_existing then
    update public.circular_responses
    set is_latest = false, updated_at = now()
    where circular_id = p_circular_id
      and department_id = p_department_id
      and school_id = p_school_id
      and is_latest = true;
  end if;

  -- 7. Insert new response row
  insert into public.circular_responses (
    circular_id,
    school_id,
    department_id,
    responder_id,
    response_type,
    status,
    reason,
    is_latest
  ) values (
    p_circular_id,
    p_school_id,
    p_department_id,
    auth.uid(),
    p_response_type,
    p_status,
    p_reason,
    true
  ) returning * into v_new_row;

  return v_new_row;
end;
$$;

revoke all on function public.submit_circular_response(uuid, uuid, uuid, public.circular_response_type, public.circular_response_status, text) from public, anon;
grant execute on function public.submit_circular_response(uuid, uuid, uuid, public.circular_response_type, public.circular_response_status, text) to authenticated, service_role;

-- 4. Update is_circular_target to accept department from assignment or verified profile
create or replace function public.is_circular_target(p_circular uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circular_targets t
    join public.circulars c on c.id = t.circular_id
    where t.circular_id = p_circular
      and public.is_school_member(c.school_id)
      and (
        (
          t.department_id is not null
          and (
            exists (
              select 1
              from public.user_role_assignments ura
              where ura.user_id = auth.uid()
                and ura.school_id = c.school_id
                and ura.department_id = t.department_id
            )
            or exists (
              select 1
              from public.profiles p
              where p.id = auth.uid()
                and p.school_id = c.school_id
                and p.department_id = t.department_id
            )
          )
        )
        or (
          t.role_key is not null
          and exists (
            select 1
            from public.user_role_assignments ura
            join public.roles r on r.id = ura.role_id
            where ura.user_id = auth.uid()
              and r.key = t.role_key
              and ura.school_id = c.school_id
          )
        )
      )
  );
$$;

-- 5. Update circular_responses_insert RLS policy to support fallback
drop policy if exists circular_responses_insert on public.circular_responses;
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
        and ura.school_id = public.circular_responses.school_id
        and (
          ura.department_id = public.circular_responses.department_id
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.school_id = public.circular_responses.school_id
              and p.department_id = public.circular_responses.department_id
          )
        )
    )
  );

