-- 0041: restore document numbering for end users (audit finding B-4).
--
-- 0023 correctly revoked EXECUTE on `generate_school_number` from `public`,
-- `anon` and `authenticated`, but the two primary write paths still called it
-- through the session client. On any environment with migrations >= 0023 those
-- paths aborted at the first statement with
-- `permission denied for function generate_school_number`, so creating a
-- circular or filing a maintenance ticket was impossible.
--
-- The raw generator stays unreachable for end users. `next_school_number` is a
-- narrow wrapper that checks who is asking, for which kind of document, in
-- which school, and only then delegates. Numbering is a side effect the caller
-- must not be able to trigger outside their own tenant.

create or replace function public.next_school_number(p_school uuid, p_kind text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_owner boolean;
begin
  if not public.is_active_user() then
    raise exception 'An active account is required to allocate a document number'
      using errcode = '42501';
  end if;

  if p_kind is null or p_kind not in ('circular', 'maintenance') then
    raise exception 'Unsupported document kind: %', coalesce(p_kind, '<null>')
      using errcode = '22023';
  end if;

  if p_school is null then
    raise exception 'A school is required to allocate a document number'
      using errcode = '22023';
  end if;

  if not exists (select 1 from public.schools s where s.id = p_school) then
    raise exception 'Unknown school' using errcode = 'P0002';
  end if;

  -- The platform owner has no school-scoped assignment, so `has_permission`
  -- can never be true for them; ownership is checked explicitly, exactly as
  -- 0040 does for every other owner bypass.
  v_is_owner := public.is_platform_owner();

  if not v_is_owner then
    if p_kind = 'circular'
      and not public.has_permission('circular.create', p_school) then
      raise exception 'Allocating a circular number requires circular.create on this school'
        using errcode = '42501';
    end if;

    if p_kind = 'maintenance'
      and not public.has_permission('maintenance.create', p_school) then
      raise exception 'Allocating a maintenance number requires maintenance.create on this school'
        using errcode = '42501';
    end if;
  end if;

  return public.generate_school_number(p_school, p_kind);
end;
$$;

-- `public`/`anon` never get it; end users get the checked wrapper, and the
-- service role keeps the raw generator (granted in 0023) for trusted jobs.
revoke all on function public.next_school_number(uuid, text) from public, anon;
grant execute on function public.next_school_number(uuid, text) to authenticated, service_role;

-- Re-assert the lockdown of the raw generator: a future migration that creates
-- it again (or a restored dump that carries PUBLIC EXECUTE) must not silently
-- hand numbering back to anon.
revoke all on function public.generate_school_number(uuid, text) from public, anon, authenticated;
grant execute on function public.generate_school_number(uuid, text) to service_role;
