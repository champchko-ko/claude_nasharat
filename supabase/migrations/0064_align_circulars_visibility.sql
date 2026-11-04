-- 0064: Align public.circulars.visibility with the application contract.
--
-- Drift on the hosted project (verified 2026-11-03):
--   * the column carries default 'all' instead of the 'internal' of 0055;
--   * its check constraint rejects 'public' (SQLSTATE 23514,
--     "circulars_visibility_check"), so the application could not store the
--     value it writes;
--   * every stored circular holds 'all' (5 published rows, 0 'public' rows).
--
-- Cause: the column already existed on the hosted project when 0055 ran.
-- `add column if not exists ... check (...)` is skipped in full when the
-- column is present, so the drifted default and the drifted constraint
-- survived while 0055's RLS policies - which filter on visibility = 'public' -
-- were applied. The public portal could therefore never serve a circular.
--
-- This migration is deliberately defensive: it removes whatever check
-- constraint governs the column, whatever it is named, normalises the drifted
-- value, and re-asserts the contract 0055 describes. It is safe to run on a
-- database that was built from the migrations (where it is a no-op) and on the
-- drifted hosted project.
--
-- 1. Make sure the column exists with 0055's type and default.
alter table public.circulars
  add column if not exists visibility text not null default 'internal';

-- 2. Drop every check constraint that governs the visibility column.
do $$
declare
  v_constraint text;
begin
  for v_constraint in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.circulars'::regclass
      and con.contype = 'c'
      and exists (
        select 1
        from pg_attribute att
        where att.attrelid = con.conrelid
          and att.attnum = any (con.conkey)
          and att.attname = 'visibility'
      )
  loop
    execute format('alter table public.circulars drop constraint %I', v_constraint);
  end loop;
end $$;

-- 3. Normalise the drifted values.
--    'all' is the pre-0055 spelling of "everyone may see this", which the
--    application now writes as 'public'. A NULL visibility carries no
--    information, so it falls back to the safe, non-public default.
update public.circulars set visibility = 'public' where visibility = 'all';
update public.circulars set visibility = 'internal' where visibility is null;

-- 4. Re-assert the constraint 0055 intends.
alter table public.circulars
  add constraint circulars_visibility_check
  check (visibility in ('public', 'internal'));

-- 5. Restore the default and nullability 0055 specifies.
alter table public.circulars alter column visibility set default 'internal';
alter table public.circulars alter column visibility set not null;

-- 6. Keep 0055's supporting index present even if 0055 was applied while the
--    column already existed.
create index if not exists circulars_visibility_status_idx
on public.circulars (school_id, visibility, status);
