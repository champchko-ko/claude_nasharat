# Production-Readiness & Security Audit

**Repository:** `School_Administration_Portal`
**Audit date:** 2026-10-28
**Commit audited:** `c46a6bb`
**Auditor roles:** senior software architect · QA automation engineer · DevSecOps engineer · application security auditor
**Mode:** read-only. **No code, migration, configuration or infrastructure file was modified.** `git status` was clean at the start and at the end of the audit.

---

## 0. Verdict

> ## 🔴 NO-GO FOR PRODUCTION
>
> Six Critical issues are open. Two of them allow a single school administrator to compromise every tenant in the platform. Two more make the core product workflows fail outright, and two mean the backup system cannot be trusted for recovery.
>
> The application must not be deployed to, or promoted within, production until at least the Critical and the deployment-blocking High findings in §5 and §6 are closed and verified.

| Gate                                            | State                                                                  |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| Formatting                                      | ❌ 72 files unformatted — blocks the CI `verify` job at its first step |
| Lint / types / unit tests / secret scan / build | ✅ green                                                               |
| E2E                                             | ⚠️ 3 passing smoke tests, unauthenticated, chromium only               |
| RLS battery (local)                             | ✅ 85/85, harness negative control validated                           |
| Live schema state                               | ❓ unverifiable (no Supabase access token)                             |
| Dependency audit                                | ✅ 0 production vulnerabilities                                        |

---

## 1. Scope and method

### Reviewed

- All 39 migrations (`supabase/migrations/0001`–`0039`) and `supabase/config.toml`.
- All 27 page/layout files under `src/app`, all 3 route handlers, and the build manifest (50 routes).
- All server actions under `src/actions`, the authorization helpers they call, and the validation layer.
- Every `SECURITY DEFINER` function, RLS policy, trigger and storage bucket policy, queried directly from a **disposable local Supabase stack**.
- Configuration, environment contract, secrets hygiene (including Git history), CI workflows, deployment and recovery documentation.

### Executed

`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run scan:secrets`, `npm run build`, `npx playwright test`, `npm audit --omit=dev`, the RLS harness and battery against the local stack, plus read-only SQL against the local database.

### Deliberately not executed

No deployment, no migration against production, no destructive test against real data, no infrastructure change.

### Equipment limits

No Supabase access token, no browser session for manual UI review, no Lighthouse/axe, no load-testing target, no SMTP mailbox, no staging clone.

---

## 2. ⚠️ Incident disclosure — the RLS battery was run against production

### What happened

The repository script

```json
"test:rls": "node --env-file=.env.local supabase/tests/rls.harness.test.mjs && node --env-file=.env.local supabase/tests/rls.battery.test.mjs"
```

loads `.env.local`, which in this workspace points at the **live** Supabase project, not the local stack. Running `npm run test:rls` therefore executed the destructive RLS battery against production.

### Verified aftermath (read-only probes)

| Check                                      | Result                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Battery schools (`slug like rls-battery%`) | 0 — removed by the script's `finally` cleanup                                                                          |
| Battery profiles (`email like battery-%`)  | 0                                                                                                                      |
| Battery auth users                         | 0                                                                                                                      |
| Live business data                         | intact — 1 school, 5 profiles, 4 role assignments, 1 public school profile                                             |
| **`audit_logs`**                           | **~1,074 → 1,435 rows (+~361)** `profiles.insert` / `profiles.delete` entries, `actor_id: null`, 2026-10-28 ~11:45 UTC |

### Assessment

- No tenant data was lost, corrupted or exposed.
- The production audit trail is now polluted with synthetic entries. It is append-only by design.
- **Cleanup options are an owner decision**, not an engineering default:
  1. Leave and annotate (recommended — preserves append-only integrity);
  2. Insert an explicit correction/summary record;
  3. Manual service-role deletion (not recommended; breaks the append-only property).

This audit took no action on the table and will take none without explicit instruction.

### Root cause

Recorded as **H-2** below: the test script hardcodes the live credentials file, is destructive, non-idempotent, and has no guard against non-local targets.

---

## 3. Severity model

| Level        | Meaning                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| **Critical** | Cross-tenant compromise, full-platform compromise, untrustworthy recovery, or a core workflow that cannot run |
| **High**     | Serious confidentiality/integrity/availability failure, or a deployment blocker                               |
| **Medium**   | Material weakness with constraints, or a correctness/UX defect with real operational impact                   |
| **Low**      | Hardening, hygiene, polish                                                                                    |

---

## 4. Findings index

| ID         | Severity | Area           | Title                                                                       |
| ---------- | -------- | -------------- | --------------------------------------------------------------------------- |
| B-1        | Critical | AuthZ          | Platform-owner forgery by any school administrator                          |
| C-1        | Critical | AuthZ          | Cross-tenant account takeover via `updateUserAction`                        |
| B-3        | Critical | Isolation      | Self `profiles.school_id` reassignment → cross-tenant staff PII read        |
| B-4        | Critical | Functional     | Circular and maintenance creation fail on a clean environment               |
| C-2        | Critical | Data safety    | Backup export silently truncates and swallows errors                        |
| C-3        | Critical | Data safety    | Restore is non-atomic and cannot rebuild a fresh database                   |
| H-1        | High     | Ops            | Live database is not in sync with committed migrations                      |
| H-2        | High     | Ops            | `test:rls` targets the live database                                        |
| H-3        | High     | Auth           | Open redirect in `/api/auth/callback`                                       |
| H-4        | High     | Auth           | Host-header poisoning in password reset                                     |
| H-5        | High     | CI             | CI red; E2E job cannot boot the app                                         |
| H-6        | High     | Ops            | Keepalive endpoint public when `CRON_SECRET` unset; cron broken when set    |
| H-7        | High     | Ops            | No health endpoint, no error monitoring                                     |
| H-8        | High     | Data safety    | Restore payloads exceed the Server Action body limit                        |
| H-9        | High     | Data safety    | Backup excludes audit logs, notifications, attachments and storage objects  |
| H-10       | High     | AuthZ          | `settings.platform.update` is grantable and treated as "owner" in 17 places |
| H-11       | High     | AuthZ          | `circular.create` alone can publish/archive circulars                       |
| H-12       | High     | Isolation      | Cross-school notification injection via the service-role client             |
| H-13       | High     | Functional     | Achievements feature always returns empty                                   |
| H-14       | High     | Isolation      | User provisioning accepts a foreign school's `departmentId`                 |
| H-15       | High     | Data integrity | `circular_targets` has no DELETE policy → stale targets + duplicates        |
| H-16       | High     | Storage        | No DELETE policies on attachment buckets → orphaned files                   |
| H-17       | High     | Storage        | `public-assets` writes are folder-only (logo overwrite bypass)              |
| H-18       | High     | Storage        | School logo upload validates size but not MIME/magic bytes                  |
| M-1 … M-47 | Medium   | —              | See §7                                                                      |
| L-1 … L-12 | Low      | —              | See §8                                                                      |

---

## 5. Critical findings

### B-1 — Platform-owner forgery by any school administrator

**Impact:** a school admin escalates to platform owner and gains the service-role backup console — read **and overwrite** of every tenant.

**Verified chain:**

1. **The reserved-key guard is UPDATE-only.** Actual trigger on the local stack:

   ```
   roles_guard_key | CREATE TRIGGER roles_guard_key BEFORE UPDATE ON public.roles
                   | FOR EACH ROW EXECUTE FUNCTION enforce_role_key_reserved()
   ```

   `INSERT` is unguarded. The function also returns early when `auth.uid() is null`.

2. **A school admin may insert a role with any key.**

   ```sql
   roles_insert | INSERT
     (is_platform_owner() OR (school_id IS NOT NULL AND NOT is_system
       AND has_permission('roles.manage', school_id)))
   ```

   `school_admin` holds `roles.manage` (`0010_seed_rbac.sql:48`).

3. **Uniqueness does not prevent it.**

   ```
   roles_system_key_idx  UNIQUE (key)             WHERE school_id IS NULL
   roles_school_key_idx  UNIQUE (key, school_id)  WHERE school_id IS NOT NULL
   ```

   The system `owner` row has `school_id IS NULL`, so `('owner', <my school>)` is a distinct permitted row.

4. **Role assignment never checks the role's tenant** (see also B-3 for the shadowed column).

5. **The app trusts `roles.key = 'owner'` with no school predicate.**

   ```ts
   // src/lib/auth/isPlatformOwner.ts:7-13
   const { data } = await admin
     .from("user_role_assignments")
     .select("id, roles!inner(key)")
     .eq("user_id", userId)
     .eq("roles.key", "owner") // ← missing .is("school_id", null)
     .limit(1)
     .maybeSingle();
   ```

   `src/lib/auth/getPlatformOwnerUserIds.ts:5-8` has the same omission. The DB helper `is_platform_owner()` does it correctly (`0038:30-37`).

6. **Payoff:** `isPlatformOwner` gates `/settings/backup`; export and restore both run on `createSupabaseAdminClient()`.

**Aggravating factors**

- `can_read_system_roles()` (`0038:60-99`) deliberately exposes the system `owner` row — including its UUID — to `users.manage` / `roles.manage` holders. That is the discovery step.
- `assertCanManageUser` and `deleteUserAction` treat platform owners as system-protected, so school management cannot remove the rogue account.
- The anon key ships to the browser by design; a plain `POST /rest/v1/roles` with the attacker's own JWT is sufficient — the app-layer `validateCreateRoleInput` is bypassable.
- Backup exports and restores write no audit row (M-38), so the escalation leaves no trace.

**Required fix (all four)**

1. `isPlatformOwner` / `getPlatformOwnerUserIds`: add `.is("school_id", null)`.
2. `enforce_role_key_reserved`: fire `BEFORE INSERT OR UPDATE`, reject `owner` unconditionally, and reject `school_id IS NOT NULL AND is_system`.
3. `assignments_insert`: reject any role whose `key = 'owner'` unless `is_platform_owner()`, and require the role's school to match the assignment's school.
4. `roles_select` / `can_read_system_roles()`: exclude the `owner` row from the manager-visible catalog.

---

### C-1 — Cross-tenant account takeover via `updateUserAction`

**Evidence:** `src/actions/settings/updateUserAction.ts:32-48`, `src/lib/school/assertCanManageUser.ts:12-35`, `src/lib/school/persistUserUpdates.ts:18-42`, `src/lib/school/syncAuthUserUpdates.ts:31-35`.

`assertCanManageUser` verifies only that the **caller** holds `users.manage` in their own school. It never loads the target profile and never compares schools:

```ts
const permitted = await hasPermission("users.manage", profile.school_id);
if (!permitted) return { allowed: false, error: "Unauthorized" };
return { allowed: true, schoolId: profile.school_id, currentUserId: profile.id };
```

`persistUserUpdates` then changes auth credentials **before** any tenant-scoped write:

```ts
const authSync = await syncAuthUserUpdates(adminClient, input.userId, input.email, input.password);
if (!authSync.success) return { success: false, error: authSync.error };

const { error } = await adminClient.from("profiles").update({...})
  .eq("id", input.userId)
  .eq("school_id", schoolId);          // tenant check arrives too late
```

`syncAuthUserUpdates` calls `auth.admin.updateUserById(userId, { email, password, email_confirm: true })` with the service role and no tenant filter.

**Impact:** any `users.manage` holder can set the email and password of any non-owner user in any tenant. The scoped profile update affects 0 rows without error, so the action still reports success. `applyUserRoleUpdate` additionally writes a role assignment in the caller's school for the foreign user.

**Note:** `deleteUserAction` and `toggleUserActiveAction` _do_ scope by `school_id`, which shows the omission is an oversight.

**Fix:** load the target profile, require `target.school_id === caller.schoolId`; perform the scoped profile update first, verify exactly one row, then update auth credentials, with compensation on failure; audit credential changes.

---

### B-3 — Self `profiles.school_id` reassignment → cross-tenant staff PII read

**The policy permits it:**

```sql
profiles_update | UPDATE
  USING      (id = auth.uid() OR is_platform_owner() OR has_permission('users.manage', school_id))
  WITH CHECK (id = auth.uid() OR is_platform_owner() OR has_permission('users.manage', school_id))
```

**The trigger exempts managers before validating protected columns** (`enforce_profile_self_update`, verified definition):

```plpgsql
if public.is_platform_owner()
  or public.has_permission('users.manage', old.school_id)
  or public.has_permission('users.manage', new.school_id) then
  return new;        -- no column checks
end if;
```

**The reader is a service-role query with an arbitrary fallback:**

```ts
// src/lib/school/getSchoolUsers.ts
const admin = createSupabaseAdminClient();
if (!resolvedId) {
  const { data: firstSchool } = await admin
    .from("schools")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle(); // arbitrary tenant
  resolvedId = firstSchool?.id ?? null;
}
```

**Exploit path:** read a target school UUID from the public landing page (`public_school_profiles` is anon-readable) → `PATCH /rest/v1/profiles?id=eq.<self>` with `{"school_id":"<victim>"}` → open `/settings/users` → receive that tenant's staff directory: names, emails, phones, job titles, departments, roles.

**Also:** `getSchoolRoles` uses the admin client with the same trust model.

**Fix:** forbid `school_id` / `department_id` changes on one's own profile for **everyone**, including managers and owners (except via an explicit transfer flow); remove the first-school fallback; validate the requested school with `hasPermission("users.manage", schoolId)` before using the admin client.

---

### B-4 — Circular and maintenance creation fail on a clean environment

**Verified privileges on the local stack:**

```
auth_can_exec    | false
service_can_exec | true
```

from `0023_function_grants.sql:32-33`, which revokes EXECUTE from `authenticated` and grants only to `service_role`. The battery asserts this denial intentionally.

**But both create flows call it on the session client:**

```ts
// src/actions/circulars/createCircularAction.ts:32-33
const supabase = await createSupabaseServerClient();   // anon key + user JWT
const res = await createCircularRecord(supabase, {...});

// src/lib/circulars/createCircularRecord.ts:16-19
const { data: refNum, error: refError } =
  await supabase.rpc("generate_school_number", { p_school, p_kind: "circular" });

// src/lib/maintenance/createMaintenanceRecord.ts:19-22 — identical
```

**Impact:** on any environment with migrations ≥ 0023 applied, creating a circular or a maintenance ticket fails at the first statement with `permission denied for function generate_school_number`. These are the product's two primary workflows.

**Why no gate caught it:** the RLS battery inserts rows directly through PostgREST; unit tests mock the Supabase client; the E2E suite is unauthenticated.

**Drift corollary:** if production still creates circulars successfully, then `0023` — a security migration — was never applied there. Both branches are blockers.

**Fix:** add a caller-scoped `next_school_number(p_school uuid, p_kind text)` that asserts `has_permission('circular.create' | 'maintenance.create', p_school)`, grant it to `authenticated`, and never grant the raw generator.

---

### C-2 — Backup export silently truncates and swallows errors

```ts
// src/lib/backup/fetchTableData.ts:10-29
let query = admin.from(tableName).select("*");     // no .range()
...
if (error) {
  console.warn(`[Backup] Failed to fetch table ${tableName}:`, error.message);
  return [];                                       // error becomes an empty table
}
```

`max_rows = 1000` (`supabase/config.toml:9`) and hosted PostgREST applies a comparable cap. Every table above 1,000 rows is exported partially with no warning; every query failure yields an empty array inside a `success: true` payload.

**Fix:** page with `.range()` until exhaustion; fail the export on any error; reconcile per-table counts against `count: "exact"`; record the result in the manifest.

---

### C-3 — Restore is non-atomic and cannot rebuild a fresh database

`src/lib/backup/restoreDatabaseBackup.ts:13-60`, `src/lib/backup/upsertTableRecords.ts:16-29`.

- `RESTORE_ORDER` writes `schools` → `school_settings` → `departments` → `locations` → `roles` → `role_permissions` → `profiles`. **`auth.users` is never exported or created**, and `profiles.id` FKs it — restore into a clean project fails after six tables have been written.
- Each table is a separate HTTP request with **no transaction** and no compensating rollback.
- Upsert-only: rows deleted after the snapshot are never removed, so the tenant is not returned to the snapshot state.
- No pre-restore snapshot, no dry-run, no row-count verification, no version ceiling.
- `metadata.scope` / `schoolId` in the payload are ignored; `access.isManager` is hard-coded `false`, so the manager path is dead code.
- The success audit row is written only after the loop, so a failure leaves no trace.
- `docs/manuals/1_Platform_Owner_Manual.md:120` claims "atomic database transactions" — false.

**Fix:** move restore into a single transactional RPC; take an automatic pre-restore snapshot; validate scope and every row's `school_id`; add an `auth.users` reconciliation step; write audit rows on start, success and failure; add a dry-run diff.

---

## 6. High findings

### H-1 — Live database is not in sync with committed migrations

Live objects exist for 0031–0034 (`schools.phone`, `schools.manager_name_ar/en`, `public_school_profiles`). However, two **independent** battery assertions failed against live that migrations 0026/0038 exist to guarantee:

- `FAIL staff cannot read the role catalog (N5) -- count=6`
- `FAIL department-scoped staff holds maintenance.create (N12) -- data=false`

The local stack passes both (85/85). Exact applied state is unverifiable without a `SUPABASE_ACCESS_TOKEN` (`supabase migration list --linked` refuses).

**Consequence:** the deployed security posture is unknown, and B-4 cannot be resolved without knowing whether 0023 is applied.

### H-2 — `test:rls` targets the live database

`package.json:14` hardcodes `--env-file=.env.local`; the battery seeds fixtures, performs cross-tenant probes and creates storage objects; it is not idempotent on a non-empty database and has no localhost guard. This caused §2.

### H-3 — Open redirect after authentication

`src/app/api/auth/callback/route.ts:8,15`:

```ts
const next = requestUrl.searchParams.get("next") ?? "/dashboard";
return NextResponse.redirect(new URL(next, request.url));
```

`//evil.example` or `https://evil.example` produces an off-site redirect immediately after a successful code exchange.

### H-4 — Host-header poisoning in password reset

`src/actions/auth/requestPasswordResetAction.ts` builds `redirectTo` from `x-forwarded-host` / `host` rather than a configured canonical URL, allowing the reset email to point at an attacker-controlled domain. `APP_URL` exists in `.env.example` and the env schema but is never consumed.

### H-5 — CI is red; the E2E job cannot boot the app

- `verify` fails at `format:check` (72 files) before lint, typecheck, tests, secret scan or build run.
- `e2e` provides no Supabase env vars; every request traverses `proxy.ts → refreshSession → getClientEnv()`, which throws when they are missing. All three smoke tests 500 in CI. `NEXT_PUBLIC_*` are inlined at build time, so runtime-only values are also insufficient.

### H-6 — Keepalive: public when unset, broken when set

`src/app/api/keepalive/route.ts:6-12` checks the bearer only when `CRON_SECRET` exists; `serverEnvSchema.ts:13` marks it optional; `.env.example` omits it. `vercel.json:2-7` declares no `Authorization` header, so the cron 401s once the secret is set. `POST` is exported with no distinct purpose.

### H-7 — No health endpoint, no error monitoring

No `/api/health` or readiness probe, no `instrumentation.ts`, no Sentry/OTel. `logError` is called from exactly one place (`sanitizeError.ts:51`); render and proxy failures are invisible.

### H-8 — Restore payloads exceed the Server Action body limit

`useRestoreFile.ts:40-44` posts the JSON through a Server Action; `next.config.mjs` does not set `serverActions.bodySizeLimit`, so the ~1 MB default applies. A 17-table export routinely exceeds it.

### H-9 — Backup coverage contradicts the documentation

17 tables exported (`exportDatabaseBackup.ts:7-25`); `audit_logs`, `notifications`, `file_metadata`, `permissions`, `system_settings`, `auth.users` and **all storage objects** are excluded, while the owner manual and the runbook claim completeness and environment migration.

### H-10 — `settings.platform.update` is grantable and treated as "owner"

`createRoleAction` / `updateRoleAction` accept arbitrary permission keys with no allowlist (`syncRolePermissions.ts:19-24`), and `role_permissions_write` (0034) permits any key on a school-owned non-system role. Seventeen call sites then compute:

```ts
const isOwner = perms.includes("settings.platform.update") || perms.includes("roles.manage");
```

Confirmed at: `assertCanManageCirculars.ts:27`, `getCircularPermissions.ts:9`, `assertCanViewReports.ts:26`, `assertCanManageUsers.ts:6`, `deleteCircularAttachmentAction.ts:24`, `settings/{school,departments,locations}/page.tsx:27`, `calendar` page/new/detail/edit (`:24/:26/:35/:36`), `circulars/[id]/edit/page.tsx:32`.

**Effect:** owner-equivalent UI authority without `is_platform_owner()`. Combined with B-1, the same key is also a stepping stone to the real console. `roles.manage` itself is effectively a tenant-superuser grant.

### H-11 — `circular.create` alone can publish and archive

- Gate is "create OR publish": `assertCanManageCirculars.ts:28-29`.
- The form submits `status` (`EditCircularFieldsGrid.tsx:60-71`), the parser forwards it (`parseCircularFormData.ts:18`), the writer persists it (`updateCircularRecord.ts:29-31`).
- No trigger restricts status: `circulars` has only `set_updated_at`, `audit_circulars`, `circulars_scope` (tenant/identity only).
- RLS allows it:
  ```sql
  circulars_update USING
    (created_by = auth.uid()) OR has_permission('circular.create', school_id)
      OR has_permission('circular.publish', school_id)
  ```

**Effect:** `circular.publish` is decorative; and because of `created_by = auth.uid()`, a **demoted** user keeps full edit and publish rights over everything they ever created, with no permission at all.

### H-12 — Cross-school notification injection

`remindCircularAction` forwards arbitrary recipient UUIDs (`getCircularReminderRecipients.ts:18-20`) and dispatch uses the service role (`dispatchModuleNotification.ts:25-40`), so RLS cannot constrain the recipient. `assignMaintenanceAction` has the same shape with a client-supplied `operatorId`. Notifications are stamped with the caller's `school_id`.

### H-13 — Achievements feature is always empty

```ts
// src/lib/achievements/getSchoolAchievements.ts
let resolvedId = schoolId;
if (!resolvedId) { /* first active school */ resolvedId = ...; }
if (!resolvedId) return [];
...
.eq("school_id", schoolId)      // ← the NULL argument, not resolvedId
```

The page is owner-gated, and a platform owner has `school_id = null` → always `[]`. The dashboard widget uses the same loader.

### H-14 — Foreign department assignment

`provisionAuthUser.ts:31` and `persistUserUpdates.ts:37` forward a client `departmentId` through the admin client; the row's school is enforced, the department is not. Because `has_permission(..., p_department)` is department-aware, this affects permission evaluation, not just referential integrity.

### H-15 — `circular_targets` has no DELETE policy

Verified: only `select`, `insert`, `update`. `updateCircularRecord.ts:43-46` deletes then re-inserts; the delete is an RLS-filtered no-op (0 rows, no error), so removed departments remain targeted (content over-exposure) and duplicates accumulate (no unique constraint). `insertCircularTargets.ts:15` ignores insert errors, so a failure can leave a circular with no targets.

### H-16 — No storage DELETE policies

`circular-attachments` and `maintenance-photos` have select/insert only. `deleteCircularAttachmentAction.ts:38-45` calls `storage.remove()` and ignores the result; objects persist. Orphaned **public-asset** logos and calendar images remain publicly readable.

### H-17 — `public-assets` writes are folder-only

`0012:61-83` gates on the school UUID segment and `calendar.manage` only, so a calendar manager can overwrite `<school>/logo/<file>` by direct API, bypassing the `settings.school.update` gate in `0030`. Policies are OR-ed, so the broader rule wins.

### H-18 — Logo upload validates size only

`uploadSchoolLogo.ts:8-21` checks 2 MB and then uploads; no MIME or magic-byte validation. The live `public-assets` bucket permits `image/svg+xml` (verified on live).

---

## 7. Medium findings

### Access control and isolation

| ID   | Finding                                                                                                                                                    | Evidence                                                  |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| M-1  | `roles.manage` treated as platform owner in reports/users gating                                                                                           | `assertCanViewReports.ts:26`, `assertCanManageUsers.ts:6` |
| M-2  | `getSchoolUsers` first-active-school fallback + admin client                                                                                               | `getSchoolUsers.ts:14-22`                                 |
| M-3  | `effective_permission_keys()` is not school-scoped                                                                                                         | `0013:9-14`                                               |
| M-4  | `assignments_insert` target-school check is a tautology (`p.school_id = p.school_id`) — any tenant's user can be attached to a role in the caller's school | verified policy text                                      |
| M-5  | `roles_update` still allows renaming a role `key` (except `owner`)                                                                                         | `0036`                                                    |
| M-6  | `circulars_insert` accepts `status='published'` directly                                                                                                   | `0011` (`circulars_insert`)                               |
| M-7  | `circular_responses` insert does not verify department targeting in app code (RLS covers it)                                                               | `submitCircularResponseAction.ts`                         |
| M-8  | `maintenance_assignments` accepts a foreign `operator_id`; the assignee can then read the ticket                                                           | `saveMaintenanceAssignment.ts:19-49`                      |
| M-9  | `reporter_department_id` is not pinned on insert                                                                                                           | `0022:65-73`                                              |
| M-10 | Last-admin lockout: dissociation ignores the last-admin guard; the user stays `is_active`                                                                  | `0036:64-67`, `0020:151-188`                              |
| M-11 | Achievements insert policy broader than the UI (any member, `visibility='public'`, `created_by` forgeable)                                                 | `0029:49-67`                                              |
| M-12 | Department heads see tickets but not history or photos                                                                                                     | `0011:320-381`, `0024:37-60`                              |
| M-13 | `permissions_select` / `role_permissions_select` are `USING (true)` for authenticated                                                                      | `0011:119-126`                                            |
| M-14 | Realtime channel names encode tenant/user identifiers                                                                                                      | `RealtimeNotificationListener.tsx`                        |

### Audit trail

| ID   | Finding                                                                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------------------------- |
| M-15 | 9 of 24 tables are unaudited (responses, attachments, assignments, achievements, notifications, sequences, permissions) |
| M-16 | Cascade deletes are skipped (`pg_trigger_depth() > 1`) — child history is destroyed without a trace                     |
| M-17 | Service-role writes are attributed to `system`, so the highest-risk admin actions have no operator                      |
| M-18 | Credential changes and backup exports/restores are not audited                                                          |
| M-19 | `actor_label` is NULL for real users; `actor_id` is nulled on profile deletion                                          |
| M-20 | Full before/after rows are stored for sensitive tables, visible school-wide to `audit.view`                             |
| M-21 | Audit page shows only the latest 50 rows, owner-only, no filters/pagination/export — contradicts `audit.view` RLS       |

### Data safety and correctness

| ID   | Finding                                                                                                                                   |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| M-22 | `working_days` is written and never read: weekend is hard-coded Friday/Saturday, while the UI promises it drives deadlines and scheduling |
| M-23 | `date_format` is written and never applied; several views use locale-less or hard-coded locale formatting                                 |
| M-24 | CSV export ignores the active filters (`ReportsHub.tsx:76` passes no `filters`)                                                           |
| M-25 | Export gives no success/failure feedback (spinner clears on a 2 s timer)                                                                  |
| M-26 | Backup "schema validation" validates the envelope only                                                                                    |
| M-27 | Backup PII is exported unencrypted with no retention policy                                                                               |
| M-28 | `deleteUserAction` / `toggleUserActiveAction` report success when 0 rows matched                                                          |
| M-29 | Loaders swallow query errors and return empty data as success                                                                             |
| M-30 | Input validation is coercion-only: no enum whitelists, UUID checks or length caps                                                         |
| M-31 | Restore runbook names a non-existent table (`campus_locations`)                                                                           |
| M-32 | Migration chain is not idempotent; a partially applied migration fails on re-run                                                          |

### UX, accessibility and product

| ID   | Finding                                                                                                   |
| ---- | --------------------------------------------------------------------------------------------------------- |
| M-33 | No `loading.tsx` anywhere and no `<Suspense>`; every page blocks on multiple queries                      |
| M-34 | No route-level `error.tsx` under `(app)` or `settings`                                                    |
| M-35 | Settings is a dead end for `audit.view`-only users (bounced to dashboard)                                 |
| M-36 | `roles.manage` shows "Create user" but the action requires `users.manage` → guaranteed failure            |
| M-37 | Platform-owner bootstrap unreachable: `ClaimOwnerButton` is never mounted and the action passes no secret |
| M-38 | Department-scoped reporting is unimplemented (`scopedDepartmentId` always null)                           |
| M-39 | Dialogs lack `role="dialog"` / focus trap / Escape / accessible name in several places                    |
| M-40 | Global error and root 404 are hardcoded Arabic with `lang="ar"`                                           |
| M-41 | No skip-to-content link; `<main>` has no id/tabIndex                                                      |
| M-42 | No `next/image`; images lack dimensions → layout shift                                                    |
| M-43 | Notifications are always Arabic (hardcoded strings in actions)                                            |
| M-44 | Notification mutations give no feedback and do not refresh the badge                                      |
| M-45 | One global pending flag disables the whole users table for a single toggle                                |
| M-46 | Circular detail/edit lack an explicit tenant compare (RLS-mitigated)                                      |
| M-47 | Production auth config is localhost-bound; SMTP/redirect setup undocumented                               |

---

## 8. Low findings

| ID   | Finding                                                                                                                            |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------- |
| L-1  | Realtime navigation double-prefixes the locale under `localePrefix: "as-needed"`                                                   |
| L-2  | `logoutAction` loses the locale via `next/navigation`                                                                              |
| L-3  | Secret scanner covers the working tree only, not Git history                                                                       |
| L-4  | CI hardening absent: mutable action tags, no `permissions`/`concurrency`/timeouts, unpinned Supabase CLI, no Dependabot/audit/SAST |
| L-5  | Four unused direct dependencies; `shadcn` is a devDependency but imported from `globals.css` (breaks `--omit=dev` builds)          |
| L-6  | `components.json` aliases `utils` to a file that does not exist                                                                    |
| L-7  | Bootstrap-owner race: two concurrent claims can both succeed                                                                       |
| L-8  | Keepalive cron schedule may exceed Vercel Hobby limits                                                                             |
| L-9  | `filterRowsForManager` is dead code (`isManager` always false)                                                                     |
| L-10 | Storage policies cast a regex-validated folder segment to `uuid` → 500 on crafted paths                                            |
| L-11 | `school_achievements.created_by` / `calendar_events.created_by` block profile deletion (no `ON DELETE`)                            |
| L-12 | `profiles` self-update can alter `invited_by` / `last_seen_at`                                                                     |

---

## 9. Verified positives

These are real strengths and should not be regressed:

- **RLS is enabled on all 24 public tables.** `school_sequences` is intentionally policy-less (service-role only).
- **All 21 `SECURITY DEFINER` functions pin `search_path`.** `has_any_owner` and `generate_school_number` are not executable by `authenticated`.
- **No destructive DDL** anywhere in 39 migrations: no `DROP TABLE`, `DROP COLUMN`, `TRUNCATE` or `DELETE FROM`.
- **Child rows bind to the parent's `school_id`** — the `0022` write-scope hardening is genuine and thorough.
- **Storage buckets are MIME- and size-limited**, attachments use short-lived signed URLs, and read access resolves through the entity audience.
- **`audit_logs` is append-only for clients** (select-only policies).
- **No secret has ever been committed** — only `.env.example` placeholders; `.env*` is ignored; Git history is clean.
- **Security headers** on all routes: HSTS (2y, preload), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **CSV formula injection is escaped**; the service worker never caches HTML, API or Supabase responses.
- **i18n key parity is exact: 692 keys in both locales.**
- No `dangerouslySetInnerHTML`, no `@ts-ignore`, 4 `any` usages.
- `npm audit --omit=dev` → 0 vulnerabilities; framework versions exact-pinned; lockfile committed.

---

## 10. Documentation contradictions found

| Document                                                | Claim                                                                                                   | Reality                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `docs/runbooks/security_and_rls_audit.md`               | School admins see aggregated response counts; department heads restricted; storage writes entity-scoped | B-1, B-3, H-11, H-15, H-17 contradict these invariants                               |
| `docs/manuals/1_Platform_Owner_Manual.md:114,120`       | Complete backup including audit logs; atomic restore                                                    | Truncated export, missing tables, non-atomic restore                                 |
| `docs/runbooks/backup_and_restore.md:15-17,25-33,64,76` | Daily Supabase backups, PITR enabled, storage tracked, `campus_locations`                               | Not configured/verifiable; storage excluded; wrong table name                        |
| `ROADMAP_AND_IMPLEMENTATION_STATUS.md:100,180,182`      | 39 suites / 121 tests; 125/125; Prettier 100%                                                           | 88 files / 253 tests; 72 files unformatted                                           |
| `INSPECTION_REPORT.md:6,12,32`                          | 18/28 migrations, 23 tables, 40/40 RLS                                                                  | 39 migrations; stale                                                                 |
| `docs/workflows/README.md:42-46`                        | Links five workflow guides                                                                              | None exist                                                                           |
| `README.md:111,114,125`                                 | E2E across browsers; verify = lint+typecheck+test+scan; zero env leaks in client                        | Chromium only; verify also runs format+build; a client component reads `process.env` |

---

## 11. Untested areas and environmental limits

| Area                                                       | Status         | Reason                                                        |
| ---------------------------------------------------------- | -------------- | ------------------------------------------------------------- |
| Live applied migration set                                 | **Unverified** | No `SUPABASE_ACCESS_TOKEN`                                    |
| Whether a forged `owner` role already exists in production | **Unverified** | Requires the read-only query in the remediation plan, Phase 0 |
| Manual UI/UX walkthrough                                   | Not performed  | No interactive browser session                                |
| Lighthouse / Core Web Vitals                               | Not measured   | No Lighthouse run, no budget                                  |
| Automated accessibility (axe)                              | Not run        | Not installed                                                 |
| Load / stress testing                                      | Not run        | No target authorised                                          |
| Password-reset email delivery                              | Not verified   | No SMTP/mailbox                                               |
| Penetration test                                           | Not performed  | Out of scope; findings are from code/policy review            |
| DR drill (restore into a throwaway project)                | Not performed  | Not authorised                                                |
| Mobile / RTL visual QA                                     | Not performed  | No device lab                                                 |
| Fresh `supabase db reset` of the full chain                | Not performed  | Would require a destructive local reset (safe, but not run)   |

---

## 12. GO / NO-GO justification

A GO requires zero unresolved Critical security, data-loss or deployment-blocking issues. Today:

1. **B-1** — a school admin can become platform owner and read or overwrite every tenant.
2. **C-1** — a school admin can take over any user account in any tenant.
3. **B-3** — a school admin can read any tenant's staff PII.
4. **B-4** — the two primary workflows fail on a clean environment.
5. **C-2 / C-3** — recovery is neither complete nor atomic, and restore cannot rebuild a database.
6. **H-1** — the deployed schema state is unknown and demonstrably diverges from the repo.
7. **H-5 / H-6 / H-7** — no trustworthy gate, no health signal, an unauthenticated endpoint.

**Verdict: NO-GO.** See `docs/audits/2026-10-28-remediation-plan.md` for the ordered fix plan and the exact GO criteria.

---

## Appendix A — RLS matrix (local stack)

All 24 public tables have `relrowsecurity = true`.

| Table                     | S   | I   | U   | D   | Notes                                                               |
| ------------------------- | --- | --- | --- | --- | ------------------------------------------------------------------- |
| `schools`                 | ✅  | ✅  | ✅  | —   | member read; `settings.school.update` write (0037)                  |
| `school_settings`         | ✅  | ✅  | ✅  | —   | member read; scoped write                                           |
| `profiles`                | ✅  | ✅  | ✅  | —   | self/owner/same-school; **self `school_id` mutation allowed (B-3)** |
| `departments`             | ✅  | ✅  | ✅  | ✅  | delete added 0036                                                   |
| `locations`               | ✅  | ✅  | ✅  | ✅  | delete added 0036                                                   |
| `roles`                   | ✅  | ✅  | ✅  | ✅  | **manager-visible catalog includes `owner` (B-1)**                  |
| `permissions`             | ✅  | ALL | ALL | ALL | owner-only writes                                                   |
| `role_permissions`        | ✅  | ALL | ALL | ALL | **any key grantable (H-10)**                                        |
| `user_role_assignments`   | ✅  | ✅  | ✅  | ✅  | **role tenant unchecked; target check tautological (B-1, M-4)**     |
| `circulars`               | ✅  | ✅  | ✅  | ✅  | **status transitions unguarded (H-11)**                             |
| `circular_targets`        | ✅  | ✅  | ✅  | —   | **no DELETE (H-15)**                                                |
| `circular_responses`      | ✅  | ✅  | ✅  | —   | append/revision by design                                           |
| `circular_attachments`    | ✅  | ✅  | —   | ✅  | entity audience                                                     |
| `maintenance_requests`    | ✅  | ✅  | ✅  | —   | transition trigger                                                  |
| `maintenance_assignments` | ✅  | ✅  | ✅  | ✅  | foreign `operator_id` accepted (M-8)                                |
| `maintenance_updates`     | ✅  | ✅  | —   | —   | append-only                                                         |
| `maintenance_attachments` | ✅  | ✅  | —   | —   | **no DELETE (H-16)**                                                |
| `school_sequences`        | —   | —   | —   | —   | service-role only (**conflicts with B-4**)                          |
| `calendar_events`         | ✅  | ✅  | ✅  | —   | anon public read                                                    |
| `notifications`           | ✅  | —   | ✅  | —   | `read_at`-only updates                                              |
| `audit_logs`              | ✅  | —   | —   | —   | append-only via definer triggers                                    |
| `system_settings`         | ✅  | ALL | ALL | ALL | owner-only                                                          |
| `file_metadata`           | ✅  | ✅  | —   | —   | owner-only insert                                                   |
| `school_achievements`     | ✅  | ✅  | ✅  | ✅  | anon public read; policy broader than UI (M-11)                     |

## Appendix B — Storage buckets (live-verified)

| Bucket                 | Public  | Limit  | Allowed MIME (live)          |
| ---------------------- | ------- | ------ | ---------------------------- |
| `circular-attachments` | no      | 10 MiB | jpeg, png, webp, pdf         |
| `maintenance-photos`   | no      | 10 MiB | jpeg, png, webp              |
| `public-assets`        | **yes** | 5 MiB  | jpeg, png, webp, **svg+xml** |

`0012_storage.sql:16` declares SVG; `config.toml:55-56` omits it; `ON CONFLICT DO NOTHING` means the live project kept the migration's permissive list. This is why the local stack looks safe and production is not.

---

_No file outside `docs/audits/` was created or modified during this audit._
