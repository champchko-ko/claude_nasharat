-- 0030: school managers need a write path for the school logo.
--
-- The public-assets bucket only admitted calendar managers (0012), so the
-- settings page had no way to store `schools.logo_path`. Logos live under
-- `<school_id>/logo/<file>` and are gated by the same permission that guards
-- the school profile itself.

create policy "school logos uploaded by school managers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets'
    and public.is_active_user()
    and (storage.foldername(name))[2] = 'logo'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.has_permission('settings.school.update', ((storage.foldername(name))[1])::uuid)
  );

create policy "school logos updated by school managers"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[2] = 'logo'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.has_permission('settings.school.update', ((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[2] = 'logo'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.has_permission('settings.school.update', ((storage.foldername(name))[1])::uuid)
  );

create policy "school logos deleted by school managers"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[2] = 'logo'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.has_permission('settings.school.update', ((storage.foldername(name))[1])::uuid)
  );
