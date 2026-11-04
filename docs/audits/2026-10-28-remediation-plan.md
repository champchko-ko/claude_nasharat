# Remediation Plan — 2026-10-28 Audit

**Source audit:** [`2026-10-28-production-readiness-audit.md`](./2026-10-28-production-readiness-audit.md)
**Status:** ⏸ **AWAITING APPROVAL — nothing in this plan has been executed.**
**Constraint:** no code, migration or infrastructure change is made until the owner approves a phase.

---

## 0. How to read this plan

- **Phases are strictly ordered.** Phase 1 must merge before Phase 2 starts, because several Phase 2 fixes are bypassable until Phase 1 closes the authorization holes.
- Every task has **acceptance criteria** that are executable, not subjective.
- **Migrations are forward-only.** Never edit an applied migration (`0001`–`0039`); new behaviour goes into `0040+`. Production state is unknown (H-1), so editing history would make drift worse.
- **No destructive DDL.** The `docs/runbooks/incident_response.md` additive-first rule stays in force.
- All SQL verification runs against a **disposable local stack** or a staging clone. Never against the live project.

---

## Phase 0 — Containment and fact-finding (no code changes)

**Goal:** stop the bleeding and learn what production actually looks like. ~0.5 day.

| #   | Task                                                                                                                                                                                                      | Output                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 0.1 | **Decide the `audit_logs` question** (see §9, decision D-1).                                                                                                                                              | Written decision recorded in the incident log                                            |
| 0.2 | **Make `test:rls` unable to touch production.** Change the script to require an explicit target and abort unless the URL host is `127.0.0.1`/`localhost`; move local credentials to `.env.test`.          | Guarded script; a run against a remote URL exits non-zero with a clear message           |
| 0.3 | **Reconcile live migrations.** With a `SUPABASE_ACCESS_TOKEN`, run `supabase migration list --linked` and compare against `0001`–`0039`. Specifically confirm whether `0023`, `0036`, `0038` are applied. | Recorded diff; resolves whether B-4 means "feature down" or "security migration missing" |
| 0.4 | **Check for existing compromise** (read-only SQL): school-scoped `owner` roles, school-scoped owner assignments, profile/assignment school mismatches, recent `database.restore` audit entries.           | Zero-or-list evidence report                                                             |
| 0.5 | **Take a production snapshot** (Supabase dashboard backup or `supabase db dump`) before any Phase 1 deployment.                                                                                           | Restorable artefact with a recorded timestamp                                            |
| 0.6 | **Confirm the live bucket MIME list** for `public-assets` (already observed to include `image/svg+xml`).                                                                                                  | Evidence attached to H-18/M-4                                                            |

**Compromise-check SQL (read-only):**

```sql
-- forged platform-owner roles
select id, key, name, school_id, is_system, created_at
from public.roles
where key in ('owner','platform_owner') and school_id is not null;

-- school-scoped assignments of the owner role
select ura.*
from public.user_role_assignments ura
join public.roles r on r.id = ura.role_id
where r.key = 'owner' and ura.school_id is not null;

-- profile/assignment school mismatches
select p.id, p.school_id as profile_school, ura.school_id as assignment_school
from public.profiles p
join public.user_role_assignments ura on ura.user_id = p.id
where p.school_id is distinct from ura.school_id;

-- backup exports/restores
select *
from public.audit_logs
where action like 'database.%'
order by created_at desc
limit 50;
```

---

## Phase 1 — Close the Critical authorization holes

**Goal:** remove every path from "school admin" to "platform owner / other tenant".
**Effort:** 3–4 engineer-days including tests.
**Gate:** Phase 2 must not start until every acceptance criterion here passes.

### 1.1 — Migration `0040_security_hardening.sql`

| Task  | Change                                                                                                                                                                                         | Acceptance                                                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1.1.1 | `enforce_role_key_reserved`: fire `BEFORE INSERT OR UPDATE`; reject `key in ('owner','platform_owner')` **unconditionally**; reject `new.school_id is not null and new.is_system`.             | Direct `insert into roles(key,name,school_id,is_system) values ('owner', ...)` raises `42501` for a `school_admin` session |
| 1.1.2 | `assignments_insert`: reject `role_id` whose `key = 'owner'` unless `is_platform_owner()`; require the role's `school_id` to equal the assignment's `school_id` (or be NULL for system roles). | Assigning the system `owner` role at school scope raises `42501`                                                           |
| 1.1.3 | Fix the shadowed column: `p.school_id = p.school_id` → `p.school_id = user_role_assignments.school_id`.                                                                                        | Assigning a foreign-tenant user as a member of the caller's school raises `42501`                                          |
| 1.1.4 | `enforce_profile_self_update`: for `old.id = auth.uid()`, reject any change to `school_id` or `department_id` **before** the manager/owner exemption.                                          | `PATCH /rest/v1/profiles?id=eq.<self> {"school_id":"<other>"}` raises `42501` for a `school_admin`                         |
| 1.1.5 | `roles_select` / `can_read_system_roles()`: exclude `key = 'owner'` from the manager-visible catalog.                                                                                          | `select * from roles where key='owner'` returns 0 rows for a `school_admin`                                                |
| 1.1.6 | `role_permissions_write`: reject `permission_key` values that are platform-scoped (`settings.platform.update` and any future `*.platform.*`).                                                  | Adding `settings.platform.update` to a school role raises `42501`                                                          |
| 1.1.7 | `circulars_update`: remove `created_by = auth.uid()` from the policy; require `circular.create` or `circular.publish`.                                                                         | A demoted creator can no longer update a circular                                                                          |
| 1.1.8 | New trigger `enforce_circular_status_transition`: transitioning into `published`/`archived`/`cancelled` requires `has_permission('circular.publish', school_id)`; reject illegal transitions.  | A `circular.create`-only role cannot set `status='published'` via REST                                                     |
| 1.1.9 | `circular_targets_delete` policy mirroring `circular_targets_insert`; unique constraint on `(circular_id, department_id, role_key)`.                                                           | Delete-then-insert on edit succeeds and leaves no duplicates                                                               |

### 1.2 — Application code

| Task  | Files                                                                                                                                                                                                                                                       | Acceptance                                                                                                 |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1.2.1 | Add the missing school predicate to platform-owner detection.                                                                                                                                                                                               | `isPlatformOwner(<school-scoped owner>)` returns `false`; `/settings/backup` redirects for that user       |
| 1.2.2 | Verify the target's tenant before any auth mutation; reorder so the scoped profile update happens first and is row-count-verified; compensate on auth failure.                                                                                              | `updateUserAction(<foreign uuid>)` returns Forbidden and changes nothing in `auth.users`                   |
| 1.2.3 | Remove the `getSchoolUsers` first-active-school fallback; require an explicit `schoolId` validated with `hasPermission("users.manage", schoolId)`.                                                                                                          | Calling `getSchoolUsers()` with `null` returns `[]` instead of tenant #1                                   |
| 1.2.4 | Introduce a single `getAuthorizationContext()` server helper (`{ userId, schoolId, roleKeys, permissions, isPlatformOwner }`) derived from `is_platform_owner()` + `effective_permission_keys()`; forbid raw `perms.includes(...)` owner checks outside it. | The 17 `isOwner` call sites reviewed; `settings.platform.update` is no longer an ownership signal anywhere |
| 1.2.5 | School-scope every notification recipient and `operatorId` before a service-role dispatch.                                                                                                                                                                  | Reminder/assignment with a foreign UUID sends 0 notifications and returns an error                         |
| 1.2.6 | Validate `departmentId` ownership on create/update user.                                                                                                                                                                                                    | A foreign department id is rejected with a field error                                                     |

**Files in scope:**
`src/lib/auth/isPlatformOwner.ts`, `src/lib/auth/getPlatformOwnerUserIds.ts`, `src/lib/school/assertCanManageUser.ts`, `src/lib/school/persistUserUpdates.ts`, `src/lib/school/syncAuthUserUpdates.ts`, `src/lib/school/getSchoolUsers.ts`, `src/lib/school/applyUserRoleUpdate.ts`, `src/lib/settings/assertCanManageUsers.ts`, `src/lib/reports/assertCanViewReports.ts`, `src/lib/circulars/assertCanManageCirculars.ts`, `src/lib/circulars/getCircularPermissions.ts`, `src/actions/circulars/deleteCircularAttachmentAction.ts`, `src/actions/settings/*`, `src/actions/circulars/remindCircularAction.ts`, `src/actions/maintenance/assignMaintenanceAction.ts`, plus the 17 `isOwner` call sites.

### 1.3 — Regression tests (must exist before the phase is "done")

Add to the RLS battery (local-only) one negative test per bypass:

1. `school_admin cannot insert a role with key 'owner'`
2. `school_admin cannot assign the system owner role at school scope`
3. `school_admin cannot assign a foreign-tenant user to their own school`
4. `a user cannot change their own profiles.school_id` (test as `users.manage` holder)
5. `school_admin cannot see the owner row in the role catalog`
6. `school_admin cannot grant settings.platform.update to a custom role`
7. `circular.create-only role cannot publish a circular`
8. `a demoted creator cannot update a circular`
9. `reminder with a foreign recipient id notifies nobody`
10. `user update with a foreign uuid returns Forbidden`

**Phase 1 exit criteria:** all 10 tests pass locally; `npm run verify` green; no new lint/type errors; the 17 `isOwner` sites either use `getAuthorizationContext()` or `isPlatformOwner()`.

**Status — 2026-10-28: COMPLETE (locally verified).**

- Migration `0040_authorization_hardening.sql` applied cleanly by `supabase db reset` (0001→0040, benign NOTICEs only).
- `npm run test:rls` → harness negative control validated + **97/97** battery checks (tests 1–8 above run there).
- Tests 9–10 are app-layer assertions in `dispatchModuleNotification.test.ts` and `assertCanManageUser.test.ts`, because both paths run through the service-role client, which RLS cannot exercise.
- Instead of the planned `getAuthorizationContext()`, ownership is now a single verified predicate: `isPlatformOwner()` (+ the optional-profile wrapper `isCurrentUserPlatformOwner()`). `grep 'includes("settings.platform.update")'` over `src/` returns 0 matches.
- `typecheck`, `lint`, `test` (90 files / 262 tests), `scan:secrets` and `build` are green. `format:check` fails on **70 pre-existing files** (72 at audit time, 2 fixed here); every file touched by this phase is Prettier-clean. The repo-wide sweep belongs to Phase 4.

---

## Phase 2 — Restore the core workflows

**Goal:** make the product actually work on a clean environment.
**Effort:** 1–2 engineer-days.

| Task | Files                                                                                                                                                             | Acceptance                                                                                               |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 2.1  | Add `next_school_number(p_school, p_kind)` with permission assertions; grant to `authenticated`; revoke the raw generator from `authenticated`. Migration `0041`. | Creating a circular and a maintenance ticket both succeed end-to-end as a `staff`/`school_admin` session |
| 2.2  | Update both create paths to call the new RPC.                                                                                                                     | No `permission denied for function` in the server logs                                                   |
| 2.3  | Fix the achievements loader to filter on `resolvedId`.                                                                                                            | `/achievements` and the dashboard widget render rows for a school-bound owner                            |
| 2.4  | Add an authenticated E2E journey per role: admin creates a circular; staff files a maintenance ticket; admin assigns it; operator closes it.                      | Playwright suite covers the two primary workflows with a real (local) Supabase session                   |

**Why this phase is separate:** B-4 is a functional outage that no existing gate can see. Until an authenticated E2E exists, a regression here ships silently.

**Status — 2026-10-28: COMPLETE (locally verified).**

- **2.1 / 2.2 —** migration `0041_next_school_number.sql` adds `next_school_number(p_school, p_kind)`: it requires an active user, a valid kind, an existing school, and (`is_platform_owner()` or `circular.create` / `maintenance.create` on that school) before delegating to the raw generator. `public`/`anon` are denied; `authenticated` and `service_role` may execute it; the raw `generate_school_number` is re-revoked from `public, anon, authenticated` and granted only to `service_role`. Verified directly in `pg_proc`/`has_function_privilege` after `supabase db reset` (0001→0041).
- Both callers (`createCircularRecord`, `createMaintenanceRecord`) now call the wrapper. The authenticated E2E proves the paths end-to-end, which is stronger than grepping the server log for a missing error.
- **2.3 —** `getSchoolAchievements` filters on the resolved school id. Both callers (`/achievements`, dashboard widget) already pass a `schoolId`, so the previous `eq("school_id", schoolId)` on a possibly-`null` parameter silently returned nothing.
- **2.4 —** `npm run test:e2e` → **7/7** (3 smoke + 4 authenticated journeys): admin creates a circular (`CIR-YYYY-NNNN`, `draft`, `created_by`), staff files a ticket (`MR-YYYY-NNNN`, `submitted`, `reporter_id`), admin assigns it (active `maintenance_assignments` row), operator starts work and resolves it. Each journey signs in through the real login form and asserts against the database with the service role.
- The operator journey initially timed out on `Mark Resolved`. Root cause was the test, not the app: `initMessageBoxBridge` (`src/lib/feedback/initMessageBoxBridge.ts`) replaces `toast.success` with a blocking `aria-modal` message box, so the success box from "Start Work" intercepted the next click. `tests/e2e/dismissMessageBox.ts` now closes it explicitly.
- **Battery:** 6 new checks for the wrapper (anon denied, staff without `circular.create` denied, staff may allocate `MR-`, admin may allocate `CIR-`, cross-school denied, invalid kind rejected) → **103/103**.
- **Harness hardening:** `supabase/tests/purgeStaleFixtures.mjs` clears `rls-battery%` schools and `@battery.local` users at the start of seeding. Two aborted runs (Kong returning 502 while the stack restarted) had left rows behind and caused a false `N6` failure; the suite is now self-healing.
- **E2E is local-only by construction:** `playwright.config.ts` reads `supabase status`, asserts loopback, and builds the app with those credentials because `NEXT_PUBLIC_*` is inlined at build time. It runs on port 3100 with `NEXT_DIST_DIR=.next-e2e` so it never reuses a dev server built for another project.
- Two follow-on fixes the E2E gate forced: `scripts/scan-secrets.mjs` now skips every `.next*` build output (the bundle legitimately inlines the public anon key, which matches the JWT pattern — a planted-secret control confirms detection still works), and `tsconfig.json` carries the `.next-e2e/types` include so the Next build stops rewriting it.
- **Gates:** `typecheck` ✅ · `lint` ✅ · `test` 90 files / 262 tests ✅ · `test:rls` 103/103 ✅ · `test:e2e` 7/7 ✅ · `scan:secrets` ✅ · `build` ✅. `format:check` remains red on 70 pre-existing files (Phase 4); every file touched here is Prettier-clean.

---

## Phase 3 — Make recovery trustworthy

**Goal:** a backup that is complete and a restore that is atomic.
**Effort:** 3–5 engineer-days.

| Task | Files                                                                                                                                                         | Acceptance                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 3.1  | Paginate `fetchTableData` with `.range()`; fail the export on any error; reconcile per-table counts.                                                          | A table with >1,000 rows exports completely; an injected error aborts the export |
| 3.2  | Add a manifest (`exported_at`, per-table counts, schema version, checksum).                                                                                   | The UI can display "17 tables, 12,431 rows, checksum …"                          |
| 3.3  | Include or explicitly declare exclusions: `audit_logs`, `notifications`, `file_metadata`, `permissions`, `system_settings`, `auth.users` and storage objects. | The manual and the runbook match the implementation exactly                      |
| 3.4  | Move restore into a single transactional RPC. Migration `0042`.                                                                                               | A forced failure mid-restore leaves the database unchanged                       |
| 3.5  | Automatic pre-restore snapshot + dry-run diff + explicit delete semantics.                                                                                    | The confirm dialog shows added/overwritten/untouched counts                      |
| 3.6  | `auth.users` reconciliation step for restore into a fresh project.                                                                                            | A restore into an empty local stack completes and the app can log in             |
| 3.7  | Route large payloads outside the Server Action body limit (route handler + signed upload), or raise the limit deliberately.                                   | A 5 MB backup restores successfully                                              |
| 3.8  | Audit export and restore start/success/failure.                                                                                                               | Every attempt appears in `audit_logs` with an operator id                        |

**Verification:** a full DR drill into a throwaway Supabase project, recording row counts before and after.

**Status — 2026-10-28: tasks 3.1–3.8 implemented and verified on the local stack. The full DR drill (below) is still open.**

- **3.1 —** `fetchTableData` pages with `.range()` (1,000 rows per request, deterministic ordering), throws on any page or count error, and reconciles rows read against PostgREST's exact count. Unit tests cover 2,500 rows exported in full, exact-multiple termination, a failing page, a count mismatch, and an unknown table.
- **3.2 —** manifest v2 carries `version`, `schemaVersion`, `exportedAt`, `exportedBy`, `scope`, `schoolId`, `tableCounts`, `totalRows`, a SHA-256 `checksum` and `exclusions`. The export card shows rows/tables/checksum; the restore dialog shows the checksum; `backupSchema` refuses a version above this build's ceiling.
- **3.3 —** `BACKUP_EXCLUSIONS` is embedded in every export, and `docs/runbooks/backup_and_restore.md` + `docs/manuals/1_Platform_Owner_Manual.md` were rewritten to match the implementation: the JSON is a configuration export, not DR; `campus_locations` and "audit logs included" are gone; the `supabase db dump` procedure is the authoritative recovery path.
- **3.4 —** `0042_restore_backup_transactional.sql` adds `restore_backup(p_tables, p_scope, p_school, p_actor)` — one transaction, independent owner verification, table allowlist, tenant validation, `auth.users` reconciliation — plus `backup_snapshots`. `0043_restore_backup_payload_columns.sql` forward-fixes 0042 to write only the columns present in the payload, so omitted columns keep their default on insert and their current value on update. Battery: non-owner actor → `42501`; `anon`/`authenticated` cannot execute the function; foreign row → `42501`; unknown table rejected; a forced failure mid-restore leaves the table written earlier in the same call empty.
- **3.5 —** the action captures a pre-restore snapshot of the **current** target scope (a full export, not a copy of the uploaded file) and the dialog previews added / overwritten / untouched counts with explicit upsert-only wording. `backup_snapshots` is readable by the platform owner only (battery).
- **3.6 —** `restore_backup_auth_users` creates the missing `auth.users` rows and email identities before `profiles`; the battery proves the reconciled account exists with exactly one identity.
- **3.7 —** `experimental.serverActions.bodySizeLimit = "12mb"` and the client refuses files above 10 MB. The authenticated E2E uploads a **5.2 MB** file through `/settings/backup`, previews it (110 new records, 0 overwrites) and restores all 110 rows. That crosses the 1 MB default where H-8 lived.
- **3.8 —** export and restore write `database.*.start/success/failure` audit rows. The battery asserts the restored row is audited; the E2E asserts both restore phases for the operator account.
- **Restore semantics:** upsert-only — it never deletes. The dialog, the runbook and the manual all say so; returning to an earlier state requires `supabase db dump`/PITR, not another restore.
- **Gates:** `typecheck` ✅ · `lint` ✅ · `test` 95 files / **279 tests** ✅ · `test:rls` **119/119** ✅ · `test:e2e` **8/8** ✅ · `scan:secrets` ✅ · `build` ✅. Local DB clean afterwards: 0 fixture schools, 0 fixture users, 0 snapshots.
- **Still open:** the DR drill itself — restore a `supabase db dump` into a throwaway project, reconcile row counts, and run the battery/E2E against it. A throwaway project is required; nothing here was tested against production.

---

## Phase 4 — Fix the delivery pipeline and operational visibility

**Goal:** a gate that can be trusted, and a deployment that can be observed.
**Effort:** 2–3 engineer-days.

| Task | Change                                                                                                                                                            | Acceptance                                                    |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 4.1  | `npm run format`, commit the result.                                                                                                                              | `format:check` passes                                         |
| 4.2  | Give the E2E job a real local Supabase stack; export URL/keys **before** `npm run build`.                                                                         | The E2E job passes in CI                                      |
| 4.3  | Add `loading.tsx` + authenticated E2E to `verify`; keep RLS in its own job but run harness + battery + helpers.                                                   | All three RLS files run in CI                                 |
| 4.4  | `/api/health` (liveness + optional DB reachability) and an external uptime check.                                                                                 | `curl /api/health` returns 200 with a version hash            |
| 4.5  | Error reporting (`instrumentation.ts` + a reporting SDK) and client error capture.                                                                                | A thrown error appears in the dashboard with a correlation id |
| 4.6  | Require `CRON_SECRET` in production; add `Authorization` to the Vercel cron; reject when unset.                                                                   | The cron succeeds; an unauthenticated call returns 401        |
| 4.7  | Document `PLATFORM_BOOTSTRAP_SECRET`, `PLATFORM_OWNER_EMAIL`, `APP_URL`, `SCHOOL_TIMEZONE`, `CRON_SECRET` in `.env.example`; consume `APP_URL` for redirect URLs. | A fresh deploy can complete bootstrap from the docs alone     |
| 4.8  | Validate `next` in the auth callback (same-origin relative only).                                                                                                 | `?next=//evil.example` redirects to `/dashboard`              |
| 4.9  | Build password-reset `redirectTo` from `APP_URL`, not request headers.                                                                                            | A spoofed `Host` header does not change the reset link        |
| 4.10 | `supabase db reset` in CI to prove `0001`→latest applies from zero.                                                                                               | Job green on a clean database                                 |

**Status — 2026-10-29: 4.1 and 4.4–4.10 implemented and verified locally; 4.2/4.3 rewritten in the workflow and validated by running its exact commands locally, not yet by a CI run.**

- **4.1 —** `npm run format` applied repo-wide (66 files, none of them behaviour); `npm run format:check` → "All matched files use Prettier code style". The sweep pushed two experiment prototypes (`NewDashboardHeaderBar`, `NewDashboardStatModalContent`) and `MaintenanceAssignSection` past the 80-line function cap; each was split into the files it needed (owner: `experiments/new-dashboard-trial/components-new-dashboard/`, `src/components/maintenance/MaintenanceOperatorSelect.tsx`). A file I had begun to create collided with an existing `NewDashboardEventList.tsx`; it was restored from git and the new list renamed `NewDashboardEventStatList.tsx`.
- **4.2 —** the E2E job now starts a local Supabase stack before running `npm run test:e2e` and no longer runs a separate `npm run build`: `playwright.config.ts` reads the keys from `supabase status`, refuses non-loopback hosts, and builds the app itself with those keys. Running the same commands locally: `supabase start` → `test:e2e` **8/8**.
- **4.3 —** RLS stays its own job and now runs `npm run test:rls` (harness **and** battery, 119 checks) instead of an inline battery invocation. Per decision, `npm run verify` stays the local non-database gate (format, lint, typecheck, unit tests, secret scan, build); authenticated E2E and RLS need a stack and remain separate jobs. `loading.tsx` was **not** added to `verify` — that part of the row assumed E2E inside `verify`, which was explicitly deferred.
- **4.4 —** `GET /api/health` returns `200 {"status":"ok","version":"<hash>","database":"not-checked"}`; `?deep=1` adds one database query and returns `503` when it fails. The version comes from `VERCEL_GIT_COMMIT_SHA` / `GIT_COMMIT_SHA` / `APP_VERSION`, and reports `unknown` rather than inventing one. **Runtime proof** against a production build: liveness `200 version=phase4runtime`, deep `200 database=ok latencyMs=13`. The external uptime check is a deployment step and is documented in the runbook/manual, not something this repo can provision.
- **4.5 —** provider-neutral reporter (decision recorded): `src/instrumentation.ts` exports `onRequestError`, which reports every unhandled server error through `reportError` with a correlation id; `src/instrumentation-client.ts` captures `error` / `unhandledrejection` before hydration; both error boundaries report and display the reference code. Reports are written as structured JSON and forwarded to `ERROR_REPORTING_URL` (+`ERROR_REPORTING_TOKEN`) when configured — no vendor SDK, no lock-in. Browser reports arrive at `POST /api/client-errors` (Zod-validated, 8 KB cap, 20/min per client, always `204` on success, never echoing the payload). **Runtime proof:** a POST with `correlationId=cli_log_probe` produced exactly one log line `{"level":"ERROR","correlationId":"cli_log_probe",…,"context":{"source":"client","kind":"boundary",…}}`; junk → `400`; valid → `204`.
- **4.6 —** `assertCronAuthorized` fails closed: with `CRON_SECRET` set, only `Authorization: Bearer <secret>` (constant-time compare) passes; unset in production → `503`; unset outside production stays usable. The unused `POST` export was removed. No secret is committed to `vercel.json` — Vercel sends the bearer automatically once `CRON_SECRET` exists. **Runtime proof:** no auth → `401`, wrong secret → `401`, correct → `200`; a production build with no secret → `503` for both requests.
- **4.7 —** `.env.example` documents `SCHOOL_TIMEZONE`, `APP_URL`, `PLATFORM_BOOTSTRAP_SECRET`, `PLATFORM_OWNER_EMAIL`, `CRON_SECRET`, `ERROR_REPORTING_URL`/`TOKEN` and `GIT_COMMIT_SHA` with the production consequences of each. `docs/runbooks/admin_guide.md` and `ROADMAP_AND_IMPLEMENTATION_STATUS.md` were corrected from "_(Optional)_ `CRON_SECRET`" to required-in-production and list the new variables.
- **4.8 —** `sanitizeNextPath` accepts only same-origin absolute paths; `?next=//evil.example`, `/\evil.example`, `https://evil.example`, `javascript:` and control characters all fall back to `/dashboard`. Covered by a table-driven route test, including the header-injection case.
- **4.9 —** `requestPasswordResetAction` builds `redirectTo` with `buildAuthRedirectUrl`, which uses `APP_URL` from the validated server env and strips a trailing slash. Request headers are no longer read; the test asserts the link is identical with `APP_URL=https://portal.example.edu` and with a trailing slash.
- **4.10 —** `supabase db reset` was run locally: `0001_extensions.sql` → `0043_restore_backup_payload_columns.sql`, "Finished … on branch main". The same command is the RLS job's first step. Stack healthy afterwards (auth health `200`), battery **119/119**, E2E **8/8**, no fixture rows left (`0` schools, `0` users, `0` snapshots).

**Gates:** `format:check` ✅ · `lint` ✅ · `typecheck` ✅ · `test` 99 files / **311** ✅ · `test:rls` **119/119** ✅ · `test:e2e` **8/8** ✅ · `scan:secrets` ✅ · `build` ✅.

**Still open:** the workflow run itself (needs a push), the external uptime monitor and an actual collector URL (deployment steps, D-8), and the Phase 3 DR drill.

---

## Phase 5 — High-priority data and storage integrity

**Effort:** 2 days.

| Task | Finding                                                                                                                    | Acceptance                                                      |
| ---- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 5.1  | Remove `image/svg+xml` from the bucket and both app allowlists; validate magic bytes on logo upload.                       | SVG upload rejected at bucket, server action and UI             |
| 5.2  | Entity-bound storage paths (`<school>/<entity>/…`) and `exists` checks against the parent row.                             | A calendar manager cannot write `<school>/logo/…`               |
| 5.3  | Storage DELETE policies for `circular-attachments` and `maintenance-photos`; check `remove()` errors; orphan sweep script. | Deleting an attachment removes the object                       |
| 5.4  | Check delete/insert results in the circular-targets edit flow; surface failures.                                           | A failed target update shows an error instead of silent success |
| 5.5  | Row-count checks on `deleteUserAction` / `toggleUserActiveAction`.                                                         | A 0-row update returns "not found", not success                 |
| 5.6  | Departments: last-admin guard on dissociation; deactivate on dissociate.                                                   | A school cannot be left without an active admin                 |

**Status — 2026-10-31: COMPLETE (locally verified).**

- **5.1 —** `image/svg+xml` removed from all buckets and allowlists; magic bytes signature checks enforced via `hasValidFileSignature`.
- **5.2 —** Storage write policies entity-bound (`0046_storage_scope_hardening.sql`), FI-06 recorded as `0036` reaffirmed (owner-only `file_metadata`).
- **5.3 —** Storage DELETE policies for `circular-attachments` and `maintenance-photos` in place (`0045_storage_delete_policies.sql`); `remove()` failures surfaced as typed errors; orphan sweep script operational.
- **5.4 —** Transactional circular response rotation (`0050_submit_circular_response.sql`) and target pipeline integrity checks verified.
- **5.5 —** User mutations verify row counts and throw typed `NotFoundError` / `ValidationError` on mismatched IDs.
- **5.6 —** Last-admin guard on dissociation and active status handling verified (`buildUserProfileUpdate`).

---

## Phase 6 — Audit trail and observability quality

**Status:** Completed (31 Oct 2026).

- **6.1 —** Migration `0052_audit_trail_hardening.sql` added `set_audit_actor()` and updated `audit_row_change()` to read `app.actor_id` / `app.actor_label` and request headers (`x-actor-id`, `x-actor-label`). `createSupabaseAdminClient` now accepts actor options and propagates headers on service-role calls.
- **6.2 —** Credential changes (password reset/update) audited via `recordCredentialAudit`; backup export/restore auditable via `writeBackupAudit`; role and role_permissions changes audited with tenant-scoped role resolution.
- **6.3 —** Cascade deletes on security-critical tables (`user_role_assignments`, `role_permissions`, `roles`, `profiles`) are no longer skipped during deep triggers (`pg_trigger_depth() > 1`).
- **6.4 —** Actor identity snapshot (`full_name (email)`) is stored at write time in `actor_label`, ensuring historical attribution survives profile deletion.
- **6.5 —** Stored metadata minimized for `school_settings` (strips large policy blobs and copy) and `profiles` (protects PII). Added audit coverage triggers for `school_achievements`, `maintenance_assignments`, `circular_responses`, and `circular_attachments`.
- **6.6 —** Audit page `/settings/audit` access aligned with RLS (`isPlatformOwner` or `hasPermission("audit.view", schoolId)`). Added search filters (action, entity type, actor, date range), pagination, and CSV export via `/api/audit/export`.

| Task | Change                                                                                                               |
| ---- | -------------------------------------------------------------------------------------------------------------------- |
| 6.1  | Propagate the acting user into service-role writes (`set_config('app.actor_id', …)` read by `audit_row_change`).     |
| 6.2  | Audit credential changes (email/password), backup export/restore, and role-permission changes.                       |
| 6.3  | Stop skipping cascade deletes for security-relevant tables; write a summary row.                                     |
| 6.4  | Populate `actor_label`; snapshot actor identity instead of a nullable FK.                                            |
| 6.5  | Minimise stored metadata for `profiles` / `school_settings`.                                                         |
| 6.6  | Audit page: filters (actor/action/date), pagination, CSV export; align access with `audit.view` or correct the docs. |

---

## Phase 7 — Medium correctness, UX and accessibility

**Effort:** 4–5 days. Can run in parallel with Phase 5/6 once Phases 1–4 are merged.

**Settings that currently lie**

- Decide and implement: `working_days` drives weekend detection and deadline calculation, and `date_format` drives all date rendering — **or** remove both fields and their UI copy. Shipping a setting that does nothing is worse than not shipping it.
- `ReportsHub` must pass the active filters to `ExportCsvButton`; export must report success/failure.
- Fix the settings access model: `audit.view` users must land on the audit page, not a redirect loop; `roles.manage` must not show a "Create user" button that always fails.
- Mount or delete `ClaimOwnerButton`; make bootstrap work with the secret.

**Interaction and accessibility**

- One shared dialog primitive (role, `aria-modal`, labelled/described, focus trap, Escape, focus restore), applied to all custom dialogs.
- Per-row pending states in the users table.
- Notification mutations: check the result, refresh, toast.
- Skip-to-content link; `next/image` with dimensions.
- Localise the global error and root 404 pages; remove hardcoded Arabic from actions and CSV headers.

**Validation**

- Zod schemas at every action boundary: enums (`status`, `priority`, `category`, `visibility`, `kind`), UUID checks, length caps, with field-level messages.

---

## Phase 8 — Test architecture and hardening (ongoing)

| Task                                                                                             | Why                                                                   |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Authenticated E2E: one journey per role (owner, school_admin, department_head, staff, operator)  | Would have caught B-4, H-13, M-24, M-35, M-36                         |
| Coverage thresholds in `vitest.config.mts`                                                       | 253 tests currently guarantee very little about actions and workflows |
| `@axe-core/playwright` in the smoke suite                                                        | Zero automated accessibility coverage today                           |
| Dependabot + `npm audit` + CodeQL in CI                                                          | No dependency or static-analysis gate                                 |
| Pin the Supabase CLI; add `permissions:`, `concurrency`, timeouts, SHA-pinned actions            | Supply-chain and flake hardening                                      |
| `engines` + `packageManager`; remove 4 unused deps; resolve `shadcn` devDependency at build time | Reproducible installs                                                 |
| Secret scanning over Git history                                                                 | Working-tree scan only today                                          |
| Docs reconciliation: ROADMAP counts, INSPECTION_REPORT, workflow links, backup claims            | Prevent future false assurance                                        |

---

## 9. Decisions required from the owner

| ID      | Decision                                                                                                          | Default recommendation                                                                                              |
| ------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **D-1** | `audit_logs` pollution (~361 synthetic rows from the accidental live battery run)                                 | Leave and annotate. Preserves append-only integrity.                                                                |
| **D-2** | Does `roles.manage` imply user management? Today it is used as a tenant-superuser proxy in 17 places.             | No. Separate `roles.manage` from `users.manage` and remove the proxy.                                               |
| **D-3** | Is `/achievements` owner-only, or school-visible? The DB policy allows any member to publish public achievements. | School-admin editable, members read; align policy and UI.                                                           |
| **D-4** | `working_days` / `date_format`: implement or remove?                                                              | Implement — a school product cannot hardcode Friday/Saturday.                                                       |
| **D-5** | Backup scope: full-platform DR, or per-school configuration export?                                               | Per-school configuration export **plus** a documented `supabase db dump` DR procedure. Never market the JSON as DR. |
| **D-6** | Should public school profiles expose `phone`/`email` to anonymous visitors?                                       | Confirm explicitly; add an opt-in flag if not.                                                                      |
| **D-7** | Migration strategy: one `0040` or several small ones?                                                             | Several small, single-purpose migrations (`0040`–`0045`), each independently reversible by a forward fix.           |
| **D-8** | Deployment target and window (Vercel + Supabase plan, PITR tier)                                                  | Needed to finalise Phase 4 and the DR runbook.                                                                      |

---

## 10. Definition of Done — the GO checklist

A deployment may be promoted only when **all** of the following hold, with evidence attached:

- [ ] Phase 0.3 complete: live migrations reconciled, no unexplained drift.
- [ ] Phase 0.4 complete: no forged `owner` role and no cross-tenant assignment found (or remediated).
- [ ] Phase 1 merged: 10 bypass regression tests pass on the local stack.
- [ ] Phase 2 merged: circular creation + maintenance lifecycle pass in authenticated E2E.
- [ ] Phase 3 merged: a restore drill into a throwaway project succeeds; row counts reconcile.
- [ ] Phase 4 merged: `npm run verify` green in CI; E2E job green; `/api/health` monitored.
- [ ] `format:check` passes.
- [ ] No Critical or High finding from the audit remains open.
- [ ] Remaining Medium findings have an owner and a dated ticket.
- [ ] Rollback plan written and exercised once (forward-fix migration or Vercel rollback).
- [ ] Production snapshot taken immediately before deployment.

---

## 11. Sequencing rules (do not violate)

1. **Never run `npm run test:rls` again until Phase 0.2 lands.**
2. **Never edit an applied migration.** Forward-only.
3. **Never deploy Phase 1 without a production snapshot** (Phase 0.5).
4. **Never run a restore against production** to test Phase 3 — use a throwaway project.
5. **Do not start Phase 2 before Phase 1's authorization tests pass** — otherwise the new workflows inherit bypassable gates.
6. **One migration per concern**, so a failure can be isolated and forward-fixed.
7. **Every fix ships with the test that would have caught it.**

---

## 12. Estimated effort

| Phase                        | Scope                                    | Estimate                 |
| ---------------------------- | ---------------------------------------- | ------------------------ |
| 0                            | Containment, drift reconciliation        | 0.5 day                  |
| 1                            | Critical authorization                   | 3–4 days                 |
| 2                            | Workflow restoration + authenticated E2E | 1–2 days                 |
| 3                            | Backup/restore                           | 3–5 days                 |
| 4                            | CI + ops visibility                      | 2–3 days                 |
| 5                            | Storage/data integrity                   | 2 days                   |
| 6                            | Audit trail quality                      | 2 days                   |
| 7                            | Medium UX/accessibility/validation       | 4–5 days                 |
| 8                            | Test architecture (ongoing)              | 2–3 days                 |
| **Total to a defensible GO** | Phases 0–4                               | **~10–15 engineer-days** |

---

## 13. What happens on approval

1. You approve the plan (and answer D-1 … D-8, or accept the defaults).
2. I implement **Phase 0.2 only** first and show you the diff.
3. Then Phase 1 migration + app changes, with the 10 bypass tests, in one reviewable change set.
4. Each subsequent phase is a separate reviewable change set with its own verification output.

No file will be modified beyond the two audit documents already written until you say to proceed.
