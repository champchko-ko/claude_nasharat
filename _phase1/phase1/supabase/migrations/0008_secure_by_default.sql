-- 0008: Row-level security is ON for every table from day one.
-- With RLS enabled and no policies, every table denies all access to the
-- `anon` and `authenticated` roles. Phase 2 adds the policies, one table at a
-- time, so no table is ever exposed by accident.

do $$
declare
  t record;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;
