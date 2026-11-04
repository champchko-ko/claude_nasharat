-- 0055: Add circular visibility (public vs internal) and update RLS policies
-- Public circulars appear to all school members and public visitors on the public page.
-- Internal circulars appear only to targeted departments (and managers/creators).

alter table public.circulars
add column if not exists visibility text not null default 'internal'
check (visibility in ('public', 'internal'));

create index if not exists circulars_visibility_status_idx
on public.circulars (school_id, visibility, status);

-- 1. Drop existing circulars_select policy to update it
drop policy if exists circulars_select on public.circulars;

-- 2. Authenticated users:
-- - creator or response manager
-- - OR published/in_progress/completed/overdue:
--   - if visibility = 'public' and is_school_member (all members see public circulars)
--   - OR is_circular_target (internal circulars only visible to targets)
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

-- 3. Anonymous / Public visitors: can view published public circulars
drop policy if exists circulars_select_public on public.circulars;
create policy circulars_select_public on public.circulars
  for select to anon
  using (status = 'published' and visibility = 'public');

-- 4. Update circular attachments policy for public circulars
drop policy if exists circular_attachments_select on public.circular_attachments;
create policy circular_attachments_select on public.circular_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.circulars c
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

drop policy if exists circular_attachments_select_public on public.circular_attachments;
create policy circular_attachments_select_public on public.circular_attachments
  for select to anon
  using (
    exists (
      select 1 from public.circulars c
      where c.id = circular_id
        and c.status = 'published'
        and c.visibility = 'public'
    )
  );

