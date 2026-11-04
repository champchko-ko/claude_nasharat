-- 0012: Storage buckets and object policies (doc §7). Private buckets with
-- short-expiry signed URLs; objects are namespaced by school: "<school_id>/...".

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'circular-attachments', 'circular-attachments', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'maintenance-photos', 'maintenance-photos', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'public-assets', 'public-assets', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  )
on conflict (id) do nothing;

create policy "circular attachments uploaded by circular creators"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'circular-attachments'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.has_permission('circular.create', ((storage.foldername(name))[1])::uuid)
  );

create policy "circular attachments read by school members"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'circular-attachments'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.is_school_member(((storage.foldername(name))[1])::uuid)
  );

create policy "maintenance photos uploaded by reporters and operators"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'maintenance-photos'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (
      public.has_permission('maintenance.create', ((storage.foldername(name))[1])::uuid)
      or public.has_permission('maintenance.update', ((storage.foldername(name))[1])::uuid)
    )
  );

create policy "maintenance photos read by school members"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'maintenance-photos'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.is_school_member(((storage.foldername(name))[1])::uuid)
  );

create policy "public assets are world readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'public-assets');

create policy "public assets uploaded by calendar managers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.has_permission('calendar.manage', ((storage.foldername(name))[1])::uuid)
  );

create policy "public assets managed by calendar managers"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.has_permission('calendar.manage', ((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'public-assets'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.has_permission('calendar.manage', ((storage.foldername(name))[1])::uuid)
  );
