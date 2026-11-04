-- 0065: Restore the public circulars read path for visitors.
--
-- Verified 2026-11-03 against the hosted project:
--   * an anonymous request to /rest/v1/circulars returns zero rows even for a
--     circular that is published with visibility = 'public' (CIR-2026-0007) and
--     belongs to the active school -> the anon policy of 0055 is not in effect;
--   * the hosted project never received 0055: 0011 creates `circulars_select`
--     for authenticated only, so no policy grants the anon role a public read
--     path on public.circulars, and the app's own
--     `.eq("visibility", "public")` filter could never be reached.
--
-- This migration re-asserts the read policies of 0055 idempotently, so it
-- repairs the hosted project whether or not 0055 is recorded as applied there.
-- Every statement is a drop-then-create: from now on this migration owns these
-- policies.
--
-- 1. RLS must be on for the policies to restrict anything.
alter table public.circulars enable row level security;
alter table public.circular_attachments enable row level security;

-- 2. Explicit read grants. Supabase's default privileges usually already
--    cover these, the grant states the intent and keeps the path working on a
--    restored database.
grant select on public.circulars to anon, authenticated;
grant select on public.circular_attachments to anon, authenticated;

-- 3. Anonymous visitors: published, public circulars of active schools.
--    0055 used `status = 'published' and visibility = 'public'`; the active
--    school check is the same one 0063 applies to the public document path.
drop policy if exists circulars_select_public on public.circulars;
create policy circulars_select_public on public.circulars
  for select to anon
  using (
    status = 'published'
    and visibility = 'public'
    and public.is_public_school_active(school_id)
  );

-- 4. School members: public circulars of their own school, targeted
--    circulars, plus the creator and the response managers (0055).
drop policy if exists circulars_select on public.circulars;
create policy circulars_select on public.circulars
  for select to authenticated
  using (
    created_by = auth.uid()
    or public.has_permission('circular.view_responses', school_id)
    or (
      status in ('published', 'in_progress', 'completed', 'overdue')
      and public.is_school_member(school_id)
      and (visibility = 'public' or public.is_circular_target(id))
    )
  );

-- 5. Attachments follow the visibility of the circular they belong to.
drop policy if exists circular_attachments_select_public on public.circular_attachments;
create policy circular_attachments_select_public on public.circular_attachments
  for select to anon
  using (
    exists (
      select 1
      from public.circulars c
      where c.id = circular_id
        and c.status = 'published'
        and c.visibility = 'public'
        and public.is_public_school_active(c.school_id)
    )
  );

drop policy if exists circular_attachments_select on public.circular_attachments;
create policy circular_attachments_select on public.circular_attachments
  for select to authenticated
  using (
    exists (
      select 1
      from public.circulars c
      where c.id = circular_id
        and (
          c.created_by = auth.uid()
          or public.has_permission('circular.view_responses', c.school_id)
          or (
            c.status in ('published', 'in_progress', 'completed', 'overdue')
            and public.is_school_member(c.school_id)
            and (c.visibility = 'public' or public.is_circular_target(c.id))
          )
        )
    )
  );
