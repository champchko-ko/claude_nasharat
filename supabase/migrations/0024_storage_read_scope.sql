-- 0024: Scope storage reads to the entity audience (findings H3/N10).
--
-- The circular/maintenance object read policies admitted any school member, so
-- a teacher could read every attachment in their school regardless of whether a
-- circular targeted them or a maintenance request was theirs to see. These
-- predicates mirror the entity read policies (circulars_select /
-- maintenance_requests_select) by resolving the object back to its entity.
--
-- SECURITY DEFINER keeps the attached-table RLS from narrowing the audience
-- differently; each predicate returns only a boolean and re-states the full
-- audience check.

create or replace function public.can_read_circular_attachment(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circular_attachments a
    join public.circulars c on c.id = a.circular_id
    where a.path = p_path
      and (
        c.created_by = auth.uid()
        or public.has_permission('circular.view_responses', c.school_id)
        or (
          c.status in ('published', 'in_progress', 'completed', 'overdue')
          and public.is_school_member(c.school_id)
          and public.is_circular_target(c.id)
        )
      )
  );
$$;

create or replace function public.can_read_maintenance_attachment(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.maintenance_attachments a
    join public.maintenance_requests m on m.id = a.request_id
    where a.path = p_path
      and (
        m.reporter_id = auth.uid()
        or m.assigned_operator_id = auth.uid()
        or public.has_permission('maintenance.assign', m.school_id)
        or public.has_permission('maintenance.close', m.school_id)
        or (
          public.has_permission('reports.view', m.school_id)
          and public.can_access_department(m.school_id, m.reporter_department_id)
        )
      )
  );
$$;

revoke all on function public.can_read_circular_attachment(text) from public, anon, authenticated;
revoke all on function public.can_read_maintenance_attachment(text) from public, anon, authenticated;
grant execute on function public.can_read_circular_attachment(text) to authenticated, service_role;
grant execute on function public.can_read_maintenance_attachment(text) to authenticated, service_role;

drop policy "circular attachments read by school members" on storage.objects;
create policy "circular attachments read by circular audience" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'circular-attachments'
    and public.can_read_circular_attachment(name)
  );

drop policy "maintenance photos read by school members" on storage.objects;
create policy "maintenance photos read by request audience" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'maintenance-photos'
    and public.can_read_maintenance_attachment(name)
  );
