# Local-first development

This project develops against a **local Supabase stack** (Docker) and promotes
schema changes to the hosted project through migration files. The migration
files in `supabase/migrations/` are the only schema source of truth; the local
stack is the executable copy; the hosted project is production.

## The three layers

| Layer                            | What it is                                 | Source of truth for                     |
| -------------------------------- | ------------------------------------------ | --------------------------------------- |
| `supabase/migrations/*.sql`      | Ordered SQL, committed                     | **Schema and roles/permissions**        |
| Local Docker stack               | Disposable database + APIs on this machine | Nothing (it is rebuilt from migrations) |
| Hosted project (`*.supabase.co`) | Production, real users                     | **Data**                                |

Schema flows **up** (`db push`). Data never flows up: a local dump restored into
production would overwrite real records.

## Everyday flow

```powershell
supabase start          # boot the stack (once per machine/session)
supabase db reset       # drop + recreate the local DB, apply all migrations
npm run seed:local      # optional: demo school, users and circulars
npm run dev             # http://localhost:3000, talks to 127.0.0.1:54321
```

`supabase db reset` intentionally does **not** seed. The RLS battery asserts
exact catalogue and fixture counts, so demo rows would change those counts and
mask regressions:

```powershell
supabase db reset       # clean database
npm run test:rls        # 152 checks; refuses a database that already has a platform owner
npm run seed:local      # demo data, after the battery has run
```

## Demo accounts (`npm run seed:local`)

Password for all four: `LocalDev123!`

| Email              | Role                              | Scope             |
| ------------------ | --------------------------------- | ----------------- |
| `owner@local.test` | `owner` (global) + `school_admin` | platform + school |
| `admin@local.test` | `school_admin`                    | demo school       |
| `head@local.test`  | `department_head`                 | العلوم            |
| `staff@local.test` | `staff`                           | اللغة العربية     |

Seed content: one school, four departments, three published circulars (one
addressed to every department), three targets, one acknowledgement. That gives
the dashboard compliance chart a mix of compliant, overdue, not-yet-due and `not_applicable` targets (17% = 1 of 6 on a fresh seed).

The owner deliberately holds **two** assignments: the global `owner` role and
`school_admin` in the demo school. `is_school_member()` only counts
school-scoped assignments, so an owner with just the global role sees no
departments — and therefore an empty compliance widget — while holding every
permission. Production has the same shape; keep it when you add accounts.

## Ports

| Service                 | URL                                                       |
| ----------------------- | --------------------------------------------------------- |
| API / REST / Auth       | http://127.0.0.1:54321                                    |
| Database                | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio                  | http://127.0.0.1:54323                                    |
| Mailpit (inbound email) | http://127.0.0.1:54324                                    |

## Environment files

- `.env.local` — points at the local stack. `npm run dev` can never touch
  production by accident.
- `.env.cloud.local` — the hosted project's URL and keys, kept for the rare case
  where you must reproduce a production-only symptom. It is **not** loaded
  automatically; copy the values over temporarily and put them back.
- `.env.example` — committed template, no secrets.

Hosted deployments get their own environment variables from the hosting provider;
`.env.local` is never used there.

## Promoting changes

```powershell
supabase migration new <snake_case_name>   # creates supabase/migrations/<ts>_<name>.sql
# ...edit the SQL, then apply locally:
supabase db reset
supabase db push                           # applies PENDING migrations to the linked project
```

`db push` sends migration SQL only. It never sends table data.

Requirements: `supabase login` (or `SUPABASE_ACCESS_TOKEN`) and, for a direct
connection, the project's database password.

### Guardrails

- Never run `supabase db reset --linked` — it drops the remote database.
- Never restore a local dump into the hosted project.
- Never `db push` while the remote has schema that no migration describes; fix
  the drift with a migration first (`supabase migration repair` only fixes the
  history table, not the schema).
- Pulling production data down for debugging is allowed, but the profile table
  holds real names and emails: anonymise before sharing or committing a dump.

## Known alignment state (2026-11-01)

- `0059_remove_auditor_role.sql` encodes the auditor role's retirement. The RLS
  battery's read-only checks now build their own school-scoped role with
  `audit.view` + `reports.view` instead of depending on the retired key.
- `0060_align_system_role_permissions.sql` gives the platform owner the full
  16-permission set, which the hosted project already had. Without it a fresh
  database would show the owner a compliance rate filtered by RLS (audit
  finding F1).
- `0061_role_management_owner_only.sql` removes `roles.manage` from
  `school_admin`, matching the hosted project and the hidden roles tab. School
  administrators keep `users.manage` (they can assign existing roles) but only
  the owner can create, edit, permission or delete roles.
- `0062_platform_owner_is_school_member.sql` makes the owner's global
  assignment count as school membership, so an owner without a school-scoped
  role still sees departments and compliance data (F15).

The hosted project has not been migrated yet: run `supabase db push` to apply
0059-0062 there. Until then its hand-edited role rows remain, and local/reset
behaviour is the reference.

## Verification commands

```powershell
npm run seed:local   # idempotent; safe to re-run
npm run test:rls     # local stack only; refuses non-loopback hosts
npm test             # unit/component suite (697 tests)
npm run typecheck
npm run lint
```
