-- 0054: Allow transitioning from 'acknowledged' (viewed) to 'approved' (responded) or 'rejected'
-- even when circular.allow_response_revision is false, because 'acknowledged' only records that
-- the department viewed the circular without submitting a final response.

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

  -- 2. Verify caller belongs to the department in this school
  if not exists (
    select 1 from public.user_role_assignments ura
    where ura.user_id = auth.uid()
      and ura.school_id = p_school_id
      and ura.department_id = p_department_id
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

