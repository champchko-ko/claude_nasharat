-- Published documents must be visible on the public portal without granting
-- anonymous callers direct access to the protected schools table.
create or replace function public.is_public_school_active(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.schools s
    where s.id = p_school_id
      and s.is_active = true
  );
$$;

revoke all on function public.is_public_school_active(uuid) from public;
grant execute on function public.is_public_school_active(uuid) to anon, authenticated, service_role;

drop policy if exists school_documents_select_public on public.school_documents;
drop policy if exists school_documents_select_authenticated on public.school_documents;

create policy school_documents_select_public on public.school_documents
  for select to anon
  using (is_published = true and public.is_public_school_active(school_id));

create policy school_documents_select_authenticated on public.school_documents
  for select to authenticated
  using (
    (is_published = true and public.is_public_school_active(school_id))
    or public.is_platform_owner()
    or (
      public.is_school_member(school_id)
      and (
        is_published = true
        or public.has_permission('settings.school.update', school_id)
        or public.has_permission('users.manage', school_id)
      )
    )
  );
