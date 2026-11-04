-- 0057: Harden school_documents policies and storage access.
-- Replaces world-readable `using (true)` policy with active school checks,
-- authenticated school membership checks, and an `is_published` flag.

-- 1. Add is_published column and index
alter table public.school_documents
  add column if not exists is_published boolean not null default true;

create index if not exists school_documents_published_idx
  on public.school_documents (school_id, is_published, slug);

-- 2. Drop legacy wide-open select policy
drop policy if exists school_documents_select on public.school_documents;
drop policy if exists school_documents_select_public on public.school_documents;
drop policy if exists school_documents_select_authenticated on public.school_documents;

-- 3. Anonymous visitors: can only read published documents of active schools
create policy school_documents_select_public on public.school_documents
  for select to anon
  using (
    is_published = true
    and exists (
      select 1 from public.schools s
      where s.id = school_documents.school_id
        and s.is_active = true
    )
  );

-- 4. Authenticated users:
-- - Platform owner can read all documents
-- - School managers can read published and draft documents of their school
-- - Regular school members and visitors can read published documents of active schools
create policy school_documents_select_authenticated on public.school_documents
  for select to authenticated
  using (
    (
      is_published = true
      and exists (
        select 1 from public.schools s
        where s.id = school_documents.school_id
          and s.is_active = true
      )
    )
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

-- 5. Harden storage.objects select policies for school-documents bucket
drop policy if exists "school documents are world readable" on storage.objects;
drop policy if exists "school documents select for anon" on storage.objects;
drop policy if exists "school documents select for authenticated" on storage.objects;

create policy "school documents select for anon"
  on storage.objects for select to anon
  using (
    bucket_id = 'school-documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and exists (
      select 1 from public.schools s
      where s.id = ((storage.foldername(name))[1])::uuid
        and s.is_active = true
    )
  );

create policy "school documents select for authenticated"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'school-documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (
      exists (
        select 1 from public.schools s
        where s.id = ((storage.foldername(name))[1])::uuid
          and s.is_active = true
      )
      or public.is_school_member(((storage.foldername(name))[1])::uuid)
      or public.is_platform_owner()
    )
  );

