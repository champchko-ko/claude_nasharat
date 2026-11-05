-- 0015: Storage buckets and policies, and the public school profile view.
--
-- Object paths no longer contain a school id:
--   circular-attachments / <circular_id>/<file>
--   maintenance-photos   / <request_id>/<file>
--   public-assets        / logo/<file>   and   calendar/<file>
--   school-documents     / <document slug>/<file>
-- Files are only readable when the database row that owns them is readable.

-- ----------------------------------------------------------------- buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('circular-attachments', 'circular-attachments', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('maintenance-photos', 'maintenance-photos', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp']),
  -- Logos and calendar images are meant for everyone, so this bucket is public.
  ('public-assets', 'public-assets', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp']),
  -- Documents can be internal, so this bucket is private; readability follows
  -- the document's status and visibility (policies below).
  ('school-documents', 'school-documents', false, 20971520,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- --------------------------------------------- "may I read this file?" checks
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
        -- Public, published circulars: anyone (including anonymous visitors).
        (c.status = 'published' and c.visibility = 'public' and public.is_public_school_active())
        or c.created_by = auth.uid()
        or public.has_school_wide_permission('circular.view_responses')
        or (
          c.status in ('published', 'in_progress', 'completed', 'overdue')
          and public.is_school_member()
          and (c.visibility = 'public' or public.is_circular_target(c.id))
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
        or public.has_permission('maintenance.assign', m.reporter_department_id)
        or public.has_permission('maintenance.close', m.reporter_department_id)
        or public.has_permission('reports.view', m.reporter_department_id)
      )
  );
$$;

create or replace function public.can_read_school_document_file(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.school_documents d
    where d.file_path = p_path
      and (
        (d.status = 'published' and d.visibility = 'public' and public.is_public_school_active())
        or (d.status = 'published' and public.is_school_member())
        or public.has_permission('settings.school.update')
        or public.has_permission('users.manage')
      )
  );
$$;

-- Anonymous visitors may check these two (public circulars and documents only).
grant execute on function public.can_read_circular_attachment(text) to anon;
grant execute on function public.can_read_school_document_file(text) to anon;
grant execute on function public.can_read_circular_attachment(text) to authenticated;
grant execute on function public.can_read_school_document_file(text) to authenticated;
grant execute on function public.can_read_maintenance_attachment(text) to authenticated;

-- ------------------------------------------------------ circular attachments
create policy "circular attachments read by audience"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'circular-attachments' and public.can_read_circular_attachment(name));

create policy "circular attachments uploaded by circular creators"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'circular-attachments'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.has_permission('circular.create')
    and exists (select 1 from public.circulars c where c.id = ((storage.foldername(name))[1])::uuid)
  );

create policy "circular attachments deleted by circular managers"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'circular-attachments'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (public.has_permission('circular.create') or public.has_permission('circular.publish'))
  );

-- --------------------------------------------------------- maintenance photos
create policy "maintenance photos read by request audience"
  on storage.objects for select to authenticated
  using (bucket_id = 'maintenance-photos' and public.can_read_maintenance_attachment(name));

create policy "maintenance photos uploaded by reporters and operators"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'maintenance-photos'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (public.has_permission('maintenance.create') or public.has_permission('maintenance.update'))
    and exists (
      select 1 from public.maintenance_requests r
      where r.id = ((storage.foldername(name))[1])::uuid
    )
  );

create policy "maintenance photos deleted by reporters and managers"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'maintenance-photos'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and exists (
      select 1 from public.maintenance_requests r
      where r.id = ((storage.foldername(name))[1])::uuid
        and (
          public.has_permission('maintenance.update')
          or (r.reporter_id = auth.uid() and public.has_permission('maintenance.create'))
        )
    )
  );

-- ------------------------------------------------------------- public assets
create policy "public assets are world readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'public-assets');

create policy "calendar images uploaded by calendar managers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets'
    and public.is_active_user()
    and (storage.foldername(name))[1] = 'calendar'
    and public.has_permission('calendar.manage')
  );

create policy "calendar images updated by calendar managers"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = 'calendar'
    and public.has_permission('calendar.manage')
  )
  with check (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = 'calendar'
    and public.has_permission('calendar.manage')
  );

create policy "school logos uploaded by school managers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets'
    and public.is_active_user()
    and (storage.foldername(name))[1] = 'logo'
    and public.has_permission('settings.school.update')
  );

create policy "school logos updated by school managers"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = 'logo'
    and public.has_permission('settings.school.update')
  )
  with check (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = 'logo'
    and public.has_permission('settings.school.update')
  );

create policy "school logos deleted by school managers"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = 'logo'
    and public.has_permission('settings.school.update')
  );

-- --------------------------------------------------------- school documents
create policy "school documents read by audience"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'school-documents' and public.can_read_school_document_file(name));

create policy "school documents uploaded by managers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'school-documents'
    and public.is_active_user()
    and (public.has_permission('settings.school.update') or public.has_permission('users.manage'))
  );

create policy "school documents updated by managers"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'school-documents'
    and (public.has_permission('settings.school.update') or public.has_permission('users.manage'))
  )
  with check (
    bucket_id = 'school-documents'
    and (public.has_permission('settings.school.update') or public.has_permission('users.manage'))
  );

create policy "school documents deleted by managers"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'school-documents'
    and (public.has_permission('settings.school.update') or public.has_permission('users.manage'))
  );

-- --------------------------------------------------- public school profile view
-- Anonymous visitors read the school profile through this view only.
create or replace view public.public_school_profiles
with (security_invoker = false) as
select
  s.id,
  s.name_ar,
  s.name_en,
  s.slug,
  s.logo_path,
  ss.public_description,
  ss.vision,
  ss.mission,
  ss.objectives,
  s.phone,
  s.manager_name_ar,
  s.manager_name_en,
  s.assistant_manager_ar,
  s.assistant_manager_en,
  s.assistant_manager_2_ar,
  s.assistant_manager_2_en,
  s.address_ar,
  s.address_en,
  ss.academic_year,
  ss.vision_ar,
  ss.vision_en,
  ss.mission_ar,
  ss.mission_en,
  s.email
from public.schools s
left join public.school_settings ss on ss.singleton = s.singleton
where s.is_active;

revoke all on public.public_school_profiles from public;
grant select on public.public_school_profiles to anon, authenticated;
