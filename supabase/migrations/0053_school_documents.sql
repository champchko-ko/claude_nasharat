-- 0053: School documents registry & storage bucket for official attachments.

-- 1. Create table for official school documents (operational plan, committees guide, counseling guide).
create table public.school_documents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  slug text not null check (slug in ('operational-plan', 'committees-guide', 'counseling-guide')),
  title text not null,
  description text,
  file_path text not null,
  file_name text not null,
  file_size integer not null default 0,
  mime_type text not null default 'application/pdf',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index school_documents_school_slug_idx on public.school_documents (school_id, slug, created_at desc);

-- 2. Row Level Security: world-readable, writeable only by platform owner and school managers.
alter table public.school_documents enable row level security;

grant select on public.school_documents to anon, authenticated;
grant insert, update, delete on public.school_documents to authenticated;

create policy school_documents_select on public.school_documents
  for select to anon, authenticated
  using (true);

create policy school_documents_insert on public.school_documents
  for insert to authenticated
  with check (
    public.is_platform_owner()
    or public.has_permission('settings.school.update', school_id)
    or public.has_permission('users.manage', school_id)
  );

create policy school_documents_update on public.school_documents
  for update to authenticated
  using (
    public.is_platform_owner()
    or public.has_permission('settings.school.update', school_id)
    or public.has_permission('users.manage', school_id)
  )
  with check (
    public.is_platform_owner()
    or public.has_permission('settings.school.update', school_id)
    or public.has_permission('users.manage', school_id)
  );

create policy school_documents_delete on public.school_documents
  for delete to authenticated
  using (
    public.is_platform_owner()
    or public.has_permission('settings.school.update', school_id)
    or public.has_permission('users.manage', school_id)
  );

-- 3. Audit trail trigger.
drop trigger if exists audit_school_documents on public.school_documents;
create trigger audit_school_documents
  after insert or update or delete on public.school_documents
  for each row execute function public.audit_row_change();

-- 4. Storage bucket for official documents.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'school-documents',
  'school-documents',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 5. Storage policies for school-documents.
create policy "school documents are world readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'school-documents');

create policy "school documents uploaded by managers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'school-documents'
    and public.is_active_user()
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (
      public.is_platform_owner()
      or (
        public.is_school_member(((storage.foldername(name))[1])::uuid)
        and (
          public.has_permission('settings.school.update', ((storage.foldername(name))[1])::uuid)
          or public.has_permission('users.manage', ((storage.foldername(name))[1])::uuid)
        )
      )
    )
  );

create policy "school documents updated by managers"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'school-documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (
      public.is_platform_owner()
      or (
        public.is_school_member(((storage.foldername(name))[1])::uuid)
        and (
          public.has_permission('settings.school.update', ((storage.foldername(name))[1])::uuid)
          or public.has_permission('users.manage', ((storage.foldername(name))[1])::uuid)
        )
      )
    )
  );

create policy "school documents deleted by managers"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'school-documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (
      public.is_platform_owner()
      or (
        public.is_school_member(((storage.foldername(name))[1])::uuid)
        and (
          public.has_permission('settings.school.update', ((storage.foldername(name))[1])::uuid)
          or public.has_permission('users.manage', ((storage.foldername(name))[1])::uuid)
        )
      )
    )
  );

