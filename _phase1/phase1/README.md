# Phase 1: new single-school baseline schema

Tables, enums, indexes, row-level security switched on (deny-all), and reference data.
No functions, triggers or policies yet (Phase 2), so **the app will not run after this
phase**. This phase only proves the schema.

Not executed anywhere yet: the SQL was only checked statically (balanced, no
`school_id` / `timezone`, every foreign key points at an earlier table).

## Apply on a new branch

```bash
git checkout -b single-school-baseline
git rm -r supabase/migrations          # the 66 old migrations stay in git history
cp -r phase1/supabase/migrations supabase/
cp phase1/supabase/seed.sql supabase/seed.sql   # replaces the old multi-tenant seed
supabase db reset
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f phase1/checks/phase1_checks.sql
```

Use your own database URL if your local port differs. Expected last line:
`phase 1 checks passed`.

## What to report back
The full error text if `supabase db reset` or the checks fail, otherwise "passed".
