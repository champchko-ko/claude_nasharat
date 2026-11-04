-- Phase 1 checks. Run after `supabase db reset`. Any failure raises an error.
do $$
declare n integer;
begin
  select count(*) into n from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE';
  if n <> 26 then raise exception 'expected 26 tables, found %', n; end if;

  select count(*) into n from information_schema.columns
   where table_schema = 'public' and column_name in ('school_id', 'timezone');
  if n <> 0 then raise exception 'school_id/timezone columns still exist: %', n; end if;

  select count(*) into n from pg_tables
   where schemaname = 'public' and not rowsecurity;
  if n <> 0 then raise exception '% tables have RLS disabled', n; end if;

  select count(*) into n from public.permissions;
  if n <> 16 then raise exception 'expected 16 permissions, found %', n; end if;

  select count(*) into n from public.roles where is_system;
  if n <> 5 then raise exception 'expected 5 system roles, found %', n; end if;

  select count(*) into n from public.roles where is_locked and key = 'owner';
  if n <> 1 then raise exception 'owner role must be locked'; end if;

  select count(*) into n from public.role_permissions;
  if n <> 0 then raise exception 'no role grants may be seeded, found %', n; end if;

  select count(*) into n from public.schools;
  if n <> 1 then raise exception 'expected exactly 1 school, found %', n; end if;

  select count(*) into n from public.school_settings;
  if n <> 1 then raise exception 'expected exactly 1 school_settings row, found %', n; end if;

  -- A second school must be impossible.
  begin
    insert into public.schools (name_ar, name_en, slug) values ('x', 'x', 'second');
    raise exception 'a second school was accepted';
  exception when unique_violation then
    null;
  end;

  -- One role per user.
  select count(*) into n from pg_indexes
   where schemaname = 'public' and tablename = 'user_role_assignments'
     and indexdef ilike '%unique%(user_id)%';
  if n < 1 then raise exception 'user_role_assignments.user_id must be unique'; end if;
end $$;

select 'phase 1 checks passed' as result;
