-- 0045: scope storage writes to the entity that owns the file, and add the
-- missing DELETE policies (findings H-16, H-17).
--
-- H-17: `public-assets` was gated by `calendar.manage` for the whole bucket, so
-- a calendar manager could overwrite `<school>/logo/<file>` through the Storage
-- API even though the logo policies in 0030 require `settings.school.update`.
-- Policies are OR-ed, so the broader rule won. Each write policy now names the
-- folder it owns.
--
-- H-16: `circular-attachments` and `maintenance-photos` only had SELECT and
-- INSERT policies. `storage.remove()` calls from the app therefore deleted
-- nothing (or failed) while the database row was removed, leaving private
-- objects orphaned. DELETE is now granted to the same audience that may edit
-- the parent entity.
--
-- Every path is `<school_id>/<entity>/<file>`; the policies also verify that
-- the parent row exists in that school, so a guessed folder cannot be used to
-- park objects under another school's namespace.

-- ---------------------------------------------------------------------------
-- 1. public-assets: the calendar folder belongs to calendar managers only.
-- ---------------------------------------------------------------------------
drop policy if exists "public assets uploaded by calendar managers" on storage.objects;
create policy "public assets uploaded by calendar managers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (storage.foldername(name))[2] = 'calendar'
    and public.has_permission('calendar.manage', ((storage.foldername(name))[1])::uuid)
    and exists (
      select 1 from public.schools s where s.id = ((storage.foldername(name))[1])::uuid
    )
  );

drop policy if exists "public assets managed by calendar managers" on storage.objects;
create policy "public assets managed by calendar managers"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (storage.foldername(name))[2] = 'calendar'
    and public.has_permission('calendar.manage', ((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'public-assets'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (storage.foldername(name))[2] = 'calendar'
    and public.has_permission('calendar.manage', ((storage.foldername(name))[1])::uuid)
    and exists (
      select 1 from public.schools s where s.id = ((storage.foldername(name))[1])::uuid
    )
  );

-- ---------------------------------------------------------------------------
-- 2. public-assets: the logo folder belongs to school managers only.
--    Recreated to add the parent-school existence check as well.
-- ---------------------------------------------------------------------------
drop policy if exists "school logos uploaded by school managers" on storage.objects;
create policy "school logos uploaded by school managers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (storage.foldername(name))[2] = 'logo'
    and public.has_permission('settings.school.update', ((storage.foldername(name))[1])::uuid)
    and exists (
      select 1 from public.schools s where s.id = ((storage.foldername(name))[1])::uuid
    )
  );

drop policy if exists "school logos updated by school managers" on storage.objects;
create policy "school logos updated by school managers"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (storage.foldername(name))[2] = 'logo'
    and public.has_permission('settings.school.update', ((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (storage.foldername(name))[2] = 'logo'
    and public.has_permission('settings.school.update', ((storage.foldername(name))[1])::uuid)
    and exists (
      select 1 from public.schools s where s.id = ((storage.foldername(name))[1])::uuid
    )
  );

-- ---------------------------------------------------------------------------
-- 3. circular-attachments: bind the object to a real circular of that school.
-- ---------------------------------------------------------------------------
drop policy if exists "circular attachments uploaded by circular creators" on storage.objects;
create policy "circular attachments uploaded by circular creators"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'circular-attachments'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$'
    and public.has_permission('circular.create', ((storage.foldername(name))[1])::uuid)
    and exists (
      select 1
      from public.circulars c
      where c.id = ((storage.foldername(name))[2])::uuid
        and c.school_id = ((storage.foldername(name))[1])::uuid
    )
  );

create policy "circular attachments deleted by circular managers"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'circular-attachments'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$'
    and exists (
      select 1
      from public.circulars c
      where c.id = ((storage.foldername(name))[2])::uuid
        and c.school_id = ((storage.foldername(name))[1])::uuid
        and (
          public.has_permission('circular.create', c.school_id)
          or public.has_permission('circular.publish', c.school_id)
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 4. maintenance-photos: bind the object to a real request of that school.
-- ---------------------------------------------------------------------------
drop policy if exists "maintenance photos uploaded by reporters and operators" on storage.objects;
create policy "maintenance photos uploaded by reporters and operators"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'maintenance-photos'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$'
    and (
      public.has_permission('maintenance.create', ((storage.foldername(name))[1])::uuid)
      or public.has_permission('maintenance.update', ((storage.foldername(name))[1])::uuid)
    )
    and exists (
      select 1
      from public.maintenance_requests r
      where r.id = ((storage.foldername(name))[2])::uuid
        and r.school_id = ((storage.foldername(name))[1])::uuid
    )
  );

create policy "maintenance photos deleted by reporters and managers"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'maintenance-photos'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$'
    and exists (
      select 1
      from public.maintenance_requests r
      where r.id = ((storage.foldername(name))[2])::uuid
        and r.school_id = ((storage.foldername(name))[1])::uuid
        and (
          public.has_permission('maintenance.update', r.school_id)
          or (
            r.reporter_id = auth.uid()
            and public.has_permission('maintenance.create', r.school_id)
          )
        )
    )
  );
