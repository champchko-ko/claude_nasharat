# Function-by-function inspection — 31 October 2026

**Repository:** `C:\Users\ahmed\Desktop\School_Administration_Portal`
**Branch:** `main` · **HEAD:** `f7bd2ed fix(circulars): update circular create, delete attachment, and remind actions`
**Working tree:** 157 modified + 21 untracked = 178 uncommitted entries, no stash.
**Inspection window:** 30–31 October 2026.
**Mode:** read-only. No application file, migration, test, or configuration was changed. This document is the only file written by this pass.

This is the second inspection and it is deliberately different from the first one. `2026-10-30-readiness-report.md` inspected _the tree_ (gates, migrations, uncommitted work). This one inspects _every exported function in the application source_ — 786 of them across 700 files — and asks, per function: who may call it, does it enforce tenancy, does it check its write result, does the row it produces belong to the caller's school, and is it reachable at all.

---

## 0. Verdict

| Dimension                        | Verdict                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend function authorization   | **Mostly sound, 4 authorization defects** — FI-04, FI-10, FI-15, FI-22. Every action does reach a guard, but three guards test something other than the caller's school permission, and one module is gated to a single account |
| Backend tenancy (school scoping) | **1 defect + 1 systemic shortcut** — `applyMaintenanceStatusChange` writes by id only; 6 readers resolve "first active school" instead of the caller's school                                                                   |
| Write-result handling            | **3 defects** — 2 writes discard errors, 1 discards a row count                                                                                                                                                                 |
| Transactional integrity          | **2 defects** — circular response rotation and maintenance assignment rotation are non-atomic                                                                                                                                   |
| Upload integrity (H-18)          | **Still inert** — validators exist, nothing calls them, errors are swallowed                                                                                                                                                    |
| Frontend functions               | **Sound** — 323 exports, all presentational; no DB access, no auth decisions, no hardcoded palette                                                                                                                              |
| Dead code                        | **22 genuinely dead exports**, 6 of them security helpers that look authoritative                                                                                                                                               |
| Gates                            | **RED** — `typecheck`, `build`, `format:check` fail (unchanged from the previous report)                                                                                                                                        |
| Migration `0048`                 | **CANNOT BE APPLIED** — ambiguous overload; also re-opens a policy `0036` closed                                                                                                                                                |
| Overall                          | **NO-GO**, unchanged. The three blockers are the same ones the tree-level pass found; this pass reports 21 findings that pass could not see (FI-04, FI-07…FI-22, FI-33…FI-36).                                                  |

The important new result is **FI-04**: the achievements module is gated to the platform owner at the page, the guard, and the dashboard, so the feature is unusable by every account except one — and possibly by that one too. That is not a security hole; it is a shipped feature that no user can reach.

---

## 1. Method

### 1.1 Inventory

A script walked `src/**/*.{ts,tsx}`, excluded `*.{test,spec,stories}.*`, and extracted every exported declaration with its file and line.

| Metric                                                                                                          | Value                                                                                                              |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Source files scanned (non-test)                                                                                 | **700**                                                                                                            |
| Lines                                                                                                           | **29,572**                                                                                                         |
| Distinct exported symbols                                                                                       | **786** (820 raw matches; 34 were `export default async function` counted twice by the extractor and were removed) |
| — in `src/actions/**` (65) + `src/lib/**` (398)                                                                 | **463**                                                                                                            |
| — in `src/components/**` (277) + `src/app/**` (42) + `src/proxy.ts` / `src/i18n` / `src/instrumentation.ts` (4) | **323**                                                                                                            |
| Files with no named export (barrels, declaration-only)                                                          | 55                                                                                                                 |
| Files over 300 lines                                                                                            | **0** (RULE #1 holds)                                                                                              |
| References to unknown RPCs or tables                                                                            | **0** (every `.rpc()` and `.from()` name was cross-checked against the live local `pg_proc` / `pg_tables`)         |

### 1.2 Per-function checks

Every one of the 786 exports was scored against this list:

1. **Reachability** — is the symbol referenced anywhere outside its own file (including tests, scripts, and `page.tsx` render trees)?
2. **Authorization** — for anything under `"use server"`, is a guard reached before the first side effect, and is the guard's predicate the _right_ predicate (not just _a_ predicate)?
3. **Tenancy** — when the function writes or reads a school-owned row, is `school_id` derived from the session rather than from the caller, and is it in the `where` clause?
4. **Write-result handling** — is the PostgREST result destructured, and is the error branch taken?
5. **Row-count / no-op detection** — for `.update()` / `.delete()`, is a zero-row result distinguishable from success?
6. **Atomicity** — does the function perform two dependent writes with an intermediate state visible to readers?
7. **Data validation** — does every client-supplied value reach the DB as a value, or as a cast through a TypeScript union with no runtime check?
8. **Dead exports** — is the symbol imported anywhere?

### 1.3 Two coverage tiers (stated so the report is not over-claimed)

| Tier                         | Scope                                                                                                                   | How it was inspected                                                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — line-by-line**         | All of `src/actions/**`, all of `src/lib/**`, `src/app/api/**`, `src/proxy.ts`, `src/i18n/**`, `src/instrumentation.ts` | Every file read in full; every exported function reasoned about individually                                                                                                                         |
| **B — automated + targeted** | `src/components/**`, `src/app/[locale]/**`                                                                              | Automated per-function scan (auth, DB access, dead export, size, console, `any`) plus full reads of every file that (a) calls a server action, (b) renders a permission decision, or (c) was flagged |

Tier B is where the confidence is lower, and I say so in §5 rather than implying uniform depth.

### 1.4 What the automated scan produced, and what survived manual review

| Flag                           | Raw count | Genuine after review               | Explanation                                                                                                                                                                                                                     |
| ------------------------------ | --------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NO_AUTH_GUARD`                | 11        | **0**                              | All 11 call a module-specific assert helper (`assertCanManageCalendar`, `assertCanManageCirculars`, `assertCanCreateMaintenance`, …) that the scanner's regex does not know. **No action is missing a guard.**                  |
| `WRITE_NO_ERROR_CHECK`         | 11        | **3**                              | 8 destructure `{ error }` on the next line. The 3 genuine ones are `saveMaintenanceAssignment` (deactivation), `applyMaintenanceStatusChange` (status update), `rollbackProvisionedUser` (both deletes).                        |
| `RAW_DB_MESSAGE`               | 18        | **18, but re-classified**          | Not a user-facing leak on its own — see FI-17 for the two paths that _are_.                                                                                                                                                     |
| `CONSOLE`                      | 7         | **4 acceptable, 3 inside loggers** | `logError`, `reportError`, `reportClientError` are the console sink by design. `ServiceWorkerRegister`, `printAttachment`, `purgeClientCaches` use `console` as their only output channel. No action or lib data function logs. |
| `ANY`                          | 3         | **3**                              | `applyCircularReportFilters`, `applyMaintenanceReportFilters`, `getMaintenanceReportData`. Report filter plumbing; typed properly in FI-26.                                                                                     |
| `SELECT_STAR`                  | 3         | **3**                              | `fetchTableData` (backup exporter — intentional), `getCircularById`, `getUserNotifications`.                                                                                                                                    |
| `LONG` (one export > 70 lines) | 48        | 48                                 | 45 components, 3 lib modules. No file exceeds 300 lines, so RULE #1 is intact; this is a complexity signal, not a violation.                                                                                                    |
| `DEAD_EXPORT`                  | 57        | **22**                             | 35 are framework pages/layouts/route handlers or barrels, which are never imported by name. The 22 genuine ones are listed in §5.1.                                                                                             |

The manual pass is what turned 57 dead-export flags into 22, and 11 missing-auth flags into 0. Reporting the raw numbers would have been wrong in both directions.

---

## 2. Backend findings (`src/actions/**`, `src/lib/**`)

Severity: **Blocker** = cannot ship · **High** = security, data integrity, or a shipped feature that cannot be used · **Medium** = latent defect · **Low** = hygiene.

### 2.1 Blockers

#### FI-01 — `typecheck` and `build` fail on the upload validator's union type (Blocker)

`src/lib/storage/validateStorageUpload.ts:12-14`:

```ts
export type UploadValidation =
  { bytes: Uint8Array; error?: never } | { bytes?: never; error: string };
```

`error` is optional on the success member, so testing `if (validation.error)` does not narrow. At `src/lib/maintenance/uploadMaintenancePhoto.ts:27` the guard at `:17` has passed but `validation.bytes` is still `Uint8Array | undefined`:

```
src/lib/maintenance/uploadMaintenancePhoto.ts(27,26): error TS2345:
  Argument of type 'Uint8Array<ArrayBufferLike> | undefined' is not assignable to parameter of type 'FileBody'.
```

`npm run build` compiles successfully in 8.8 s and then fails at `Running TypeScript`. This is the only reason `npm run verify` cannot pass.

**Fix:** `{ ok: true; bytes: Uint8Array } | { ok: false; error: string }`, and update the three consumers (`uploadMaintenancePhoto`, `assertValidMaintenancePhoto`, `assertValidCircularDocuments`).

---

#### FI-02 — `0048` creates an ambiguous `effective_permission_keys()` overload (Blocker)

`0013_effective_permissions.sql:2` defines `public.effective_permission_keys()` with zero parameters. `0048_security_hardening_m4_m5_m8_m9_m10_n11.sql:86` adds `effective_permission_keys(p_school uuid default null)`. A defaulted parameter does not replace a zero-argument function; it creates a second candidate. Executing `0048` inside a rolled-back transaction succeeds statement by statement, and then:

```
ERROR:  function public.effective_permission_keys() is not unique
HINT:  Could not choose a best candidate function. You might need to add explicit type casts.
```

`src/lib/rbac/getEffectivePermissions.ts:5` calls `supabase.rpc("effective_permission_keys")` with no arguments — so after this migration resolves, that call is ambiguous.

**The failure mode is worse than a crash, and this is the part the first report got wrong.** Three call sites wrap it:

- `src/lib/circulars/assertCanManageCirculars.ts:27` — `.catch((): string[] => [])`
- `src/lib/reports/assertCanViewReports.ts:26` — `.catch((): string[] => [])`
- `src/lib/settings/assertCanAccessSettings.ts:19` — `.catch((): string[] => [])`

The RPC error never throws; it degrades to `[]`. So the symptom of `0048` is not an error page, it is **every circular manager, report viewer, and settings admin being told "Unauthorized"** while the platform owner keeps working. That is a support-ticket outage, not a stack trace — which is why it must be fixed before deploy, not after.

**Fix:** `drop function if exists public.effective_permission_keys();` immediately before the new definition, then re-issue the grants.

---

#### FI-03 — `format:check` fails on 37 files (Blocker for `verify`)

`npx prettier --check .` reports 37 code files plus `audit-report-2026-10-30.md`. 35 are the redesign, `tailwind.config.js` and `src/lib/storage/validateStorageUpload.ts` are ours. `npm run verify` runs `format:check` first, so it fails before reaching `typecheck`.

Full list is in the previous report (`2026-10-30-readiness-report.md` §2.1 F-04) and is unchanged.

---

### 2.2 High

#### FI-04 — The achievements module is gated to the platform owner, and is probably unusable by them too (High)

Four independent gates, all testing `isPlatformOwner` where the database tests `has_permission('calendar.manage', school_id)`:

| Layer         | File:line                                                       | Predicate                                                                                     |
| ------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Page          | `src/app/[locale]/(app)/achievements/page.tsx:24-27`            | `if (!isOwner) redirect({ href: "/dashboard" })`                                              |
| Action guard  | `src/actions/achievements/canRegisterAchievement.ts:10`         | `return isPlatformOwner(userId)` — `schoolId`, `_userDeptId`, `_targetDeptId` are all ignored |
| Guard wrapper | `src/actions/achievements/assertCanRegisterAchievement.ts:8-10` | throws `ForbiddenError` unless `profile.school_id` is set                                     |
| Dashboard     | `src/app/[locale]/(app)/dashboard/page.tsx:47`                  | `const achievements = isOwner ? await getSchoolAchievements(schoolId) : []`                   |

Consequences, in order of certainty:

1. A school administrator with `calendar.manage` — the exact audience the DB policies in `0029_school_achievements.sql:62-120` were written for — cannot open the page, cannot create, cannot edit, cannot delete. Every `createAchievementAction` / `updateAchievementAction` / `deleteAchievementAction` call returns `Forbidden` for them.
2. A platform owner has no `school_id` (the documented reason `createUserAction` fails for owners — see the previous report). `assertCanRegisterAchievement` checks `!profile?.school_id` **before** it ever reaches `canRegisterAchievement`, so for that account the action throws `Forbidden` too.
3. `getSchoolAchievements(profile.school_id)` with `schoolId = null` falls back to "first active school" (`src/lib/achievements/getSchoolAchievements.ts:9-17`), so even a read is scoped by coincidence.

Net: **a fully built CRUD module (5 actions, 14 components, 2 dialogs, 2 forms) that no user can use**, contradicting decision **D-3** ("school-admin editable achievements; members read") and contradicting the RLS that already implements D-3 correctly.

**Fix:** replace the page gate and the action guard with `hasPermission("calendar.manage", schoolId)` (the same predicate the policies use), delete `canRegisterAchievement`, and make the dashboard call unconditional — RLS already filters `visibility` and school membership.

---

#### FI-05 — The upload validators are never called and both helpers discard errors (High, H-18 not closed)

Six files were added for H-18. Four of them are inert:

| File                                                 | Status                                |
| ---------------------------------------------------- | ------------------------------------- |
| `src/lib/maintenance/maintenancePhotoRules.ts`       | used by `uploadMaintenancePhoto`      |
| `src/lib/maintenance/assertValidMaintenancePhoto.ts` | **zero call sites**                   |
| `src/lib/circulars/circularDocumentRules.ts`         | **not used by the circular uploader** |
| `src/lib/circulars/assertValidCircularDocuments.ts`  | **zero call sites**                   |

Both helpers return `Promise<void>` and drop the uploader's `{ error }`:

- `src/lib/maintenance/handleOptionalPhoto.ts:13` returns `Promise<void>`; `:15-21` awaits `uploadMaintenancePhoto` and ignores the result.
- `src/lib/circulars/handleCircularDocumentsUpload.ts:15` returns `Promise<void>`; `:17-25` awaits `uploadCircularDocument` in a loop and ignores every result.

So a rejected file is indistinguishable from a stored one, and the ordering guarantees the worst outcome:

| Call site                                             | Domain row written first    | Upload attempted at                          |
| ----------------------------------------------------- | --------------------------- | -------------------------------------------- |
| `src/actions/maintenance/createMaintenanceAction.ts`  | ticket inserted at `:28-39` | `:46`                                        |
| `src/lib/maintenance/applyMaintenanceStatusChange.ts` | evidence upload at `:22`    | before the update — but its error is dropped |
| `src/actions/circulars/createCircularAction.ts`       | circular + targets inserted | `:60`                                        |
| `src/actions/circulars/updateCircularAction.ts`       | circular updated            | `:51`                                        |

`maintenance_requests` has no DELETE policy, so a ticket created without its photo cannot be cleaned up by the user who created it.

**Fix:** return `{ error?: string }` from both helpers, propagate at the four call sites, and call the two assert helpers **before** the parent insert.

---

#### FI-06 — `0048` re-opens a write primitive that `0036` deliberately closed (High, security regression)

`0036_production_audit_fixes.sql:118-122` replaced the member-writable `file_metadata_insert` policy with `with check (public.is_platform_owner())`, with a comment explaining that nothing in the app reads or writes `file_metadata` and that the policy was a fabrication primitive.

`0048:40-48` replaces it again with:

```sql
with check (
  public.is_active_user()
  and public.is_school_member(school_id)
  and path like school_id::text || '/%'
  and (owner_id is null or owner_id = auth.uid())
)
```

`file_metadata` appears in exactly one place in `src`: `src/lib/backup/backupExclusions.ts:19`. It is still never written. `path` is still free text and globally unique, so `0036`'s squatting/oracle surface returns, narrowed to one's own school prefix.

**Fix:** delete section 2 of `0048`; `0036` stays in force. If M8 needs a DB guarantee, add `path like school_id::text || '/%'` to the _owner-only_ policy.

---

#### FI-07 — Any profile update that omits `isActive` reactivates a deactivated user (High)

`src/lib/school/buildUserProfileUpdate.ts:22`:

```ts
is_active: input.isActive ?? true,
```

`isActive` is optional on the input type (`:14`). `persistUserUpdates` calls this for every user edit — name, phone, job title, department. Editing a deactivated user's job title therefore sets `is_active = true`.

This matters more than it looks, because `is_active` is the gate on every helper in the database: `is_active_user()` is consulted by `has_permission`, `effective_permission_keys`, and the storage write policies. One unrelated field edit silently restores a suspended account's full authority.

**Fix:** omit the key when `isActive` is `undefined` (`...(input.isActive === undefined ? {} : { is_active: input.isActive })`), or make it required and pass the current value from the form.

---

#### FI-08 — Circular response rotation destroys the current response before the new one exists (High)

`src/actions/circulars/submitCircularResponseAction.ts:47-62`:

```ts
await supabase.from("circular_responses")
  .update({ is_latest: false })
  .eq("circular_id", circularId)
  .eq("department_id", profile.department_id);      // result discarded

const { error } = await supabase.from("circular_responses").insert({ …, is_latest: true });
```

Two defects:

1. **No transaction.** If the insert fails (constraint, RLS, network), the department is left with **zero** current responses. `is_latest` is the only thing compliance reporting counts, so the department silently drops out of the report.
2. **The update result is discarded** — an RLS denial there is invisible, and the insert then violates the partial unique index on `(circular_id, department_id) where is_latest`, surfacing as a generic conflict.

**Fix:** do it in one `plpgsql` function (`submit_circular_response(p_circular, p_type, p_status, p_reason)`) that performs both statements under one transaction and returns the new row. The RLS `circular_responses_insert` policy already exists and can be reused by the function body if it is `security invoker`.

---

#### FI-09 — Notification content is hardcoded Arabic in three actions (High for the `en` locale)

`routing.localePrefix = "as-needed"` with `locales: ["ar", "en"]` (`src/i18n/routing.ts`). English is a supported, reachable locale. Three actions write user-visible Arabic literals into `notifications.title` / `body`:

| File:line                                                          | Field                     |
| ------------------------------------------------------------------ | ------------------------- |
| `src/actions/circulars/publishCircularAction.ts` (title, body)     | new-circular notification |
| `src/actions/circulars/remindCircularAction.ts` (title)            | reminder notification     |
| `src/actions/maintenance/assignMaintenanceAction.ts` (title, body) | assignment notification   |

These are server-side writes to a shared row, so there is no locale context available at write time — but there is a `notifications.type` column and a `payload jsonb` column (`0048:110-111`). The locale-independent fix is to store the _type_ plus `payload` (which already exists and is unused) and resolve the title in `NotificationItem` with `useTranslations`. That is also what `payload` was added for.

**Fix:** stop writing prose server-side; write `type` + `payload`, render in the client. Interim: at least route the three strings through the same i18n catalogue so they can be translated.

---

#### FI-10 — A permission-loading failure is silently converted into "no permissions" (High, resilience)

Three auth helpers swallow the RPC failure and continue with an empty permission set:

- `src/lib/circulars/assertCanManageCirculars.ts:27`
- `src/lib/reports/assertCanViewReports.ts:26`
- `src/lib/settings/assertCanAccessSettings.ts:19`

All three then return `{ authorized: false, error: "Unauthorized" }` (or throw `ForbiddenError`). The operator sees an authorization verdict; the actual cause is an infrastructure failure. This is precisely how FI-02 would present, and it also means a transient network blip locks every manager out of three modules with no log line and no distinction from a real denial.

**Fix:** let the error propagate (`getEffectivePermissions` already throws), and let `sanitizeError` produce a 500 with a correlation id. If a fail-closed fallback is wanted, log it and return a distinct code (`PERMISSIONS_UNAVAILABLE`) so the UI can say "try again" instead of "you are not allowed".

---

### 2.3 Medium

#### FI-11 — `roles.key` has no unique index, so `role_key` targeting can be spoofed (Medium)

Verified against the local schema: `public.roles` has `roles_pkey`, `roles_reserved_key_check` (blocks `owner`/`platform_owner` for school-scoped rows) and the `school_id` FK. **No unique index on `key`.**

`0048:119-121` adds `circular_targets_role_key_check` restricting `role_key` to the six seeded keys. That constraint is correct _today_ but it constrains the target, not the role. A school administrator can insert a role with `key = 'staff'` (only `owner`/`school_admin` are blocked at `0048:52-63`), grant it permissions, and become the recipient of every circular targeted at `role_key = 'staff'` — while `assignUserRole` (`src/lib/school/assignUserRole.ts:12-24`) prefers a school-scoped role over the system one, so the custom role wins.

Not a permission escalation; a targeting and labelling integrity defect. It is the missing half of N11.

**Fix:** `create unique index if not exists roles_key_unique on public.roles (key);` — after confirming no duplicates exist in the live project (the local catalog has six distinct keys).

---

#### FI-12 — The operator-sync trigger never handles deactivation (Medium)

`0048:126-147`:

```sql
if new.is_active then
  update public.maintenance_requests set assigned_operator_id = new.operator_id …
end if;
```

`src/lib/maintenance/saveMaintenanceAssignment.ts:10-24` deactivates the previous assignment and then inserts a new one. On the deactivation, the trigger does nothing, so `maintenance_requests.assigned_operator_id` keeps pointing at the previous operator until the app overwrites it at `:30-40`.

Today the app always overwrites, so the stale window is a few statements. But the column now has two writers with different semantics. Any future path that revokes an assignment without reassigning (an obvious next feature) leaves a request claiming an operator who is no longer assigned — and `assertCanTransitionStatus` uses `assigned_operator_id` to decide who may resolve.

**Fix (pick one, and only one):** extend the trigger to clear `assigned_operator_id` when `new.is_active` is false and the request currently points at `new.operator_id`, then delete the app's write; or drop the trigger and keep `saveMaintenanceAssignment` as the only writer.

---

#### FI-13 — `applyMaintenanceStatusChange` updates by id only and cannot detect a no-op (Medium)

`src/lib/maintenance/applyMaintenanceStatusChange.ts:34-41`:

```ts
const { error: updateError } = await supabase
  .from("maintenance_requests")
  .update(updatePayload)
  .eq("id", requestId); // no .eq("school_id", schoolId)
```

`schoolId` is in scope and is not used in the predicate. Two consequences:

1. A caller can pass a foreign `requestId`. RLS refuses the update, PostgREST returns **zero rows and no error**, and the function reports success. The status-change audit row is then written at `:43-51` against the foreign request — that insert is the one that finally fails, with an error that is _also_ discarded (`insertMaintenanceUpdate` returns `{ error }`, and the return value is dropped).
2. Even in the happy path, `.eq("id")` alone cannot distinguish "updated" from "row vanished / not yours".

**Fix:** add `.eq("school_id", schoolId)`, select the updated id, return `{ error }` when the row count is 0, and check `insertMaintenanceUpdate`'s result.

---

#### FI-14 — `saveMaintenanceAssignment` discards the deactivation error (Medium)

`src/lib/maintenance/saveMaintenanceAssignment.ts:10-14`:

```ts
await supabase
  .from("maintenance_assignments")
  .update({ is_active: false })
  .eq("request_id", params.requestId)
  .eq("school_id", params.schoolId);
```

If this fails, the old assignment stays active and the new assignment is inserted alongside it — two active operators for one request, which the partial unique index would normally prevent and which `assertCanTransitionStatus` resolves arbitrarily. The insert at `:16-25` _is_ checked, so the function returns success after a half-applied rotation.

**Fix:** `const { error } = …; if (error) return { error: error.message };`.

---

#### FI-15 — `assertCanViewReports` always returns `scopedDepartmentId: null` (Medium)

`src/lib/reports/assertCanViewReports.ts:37-42` returns a hardcoded `scopedDepartmentId: null` to every caller, while the type (`:12`) presents it as a real scope. A department head holding `reports.view` therefore reads the whole school's compliance data, and the report components that accept the field are given `null` in every branch.

Either the field is load-bearing (then it is a broken department scoping control) or it is not (then it is a misdirection that will be relied on later). Both need an answer.

**Fix:** derive it — `profile.department_id` when the caller holds `reports.view` and no school-wide permission, `null` otherwise — and add a battery check that a department head's report query is filtered.

---

#### FI-16 — Four RLS policies contain a tautological subquery, voiding department scoping (Medium)

`pg_policies` on the local stack shows the same degenerate predicate in four policies:

| Table                 | Policy                       |
| --------------------- | ---------------------------- |
| `circular_responses`  | `circular_responses_insert`  |
| `school_achievements` | `school_achievements_insert` |
| `school_achievements` | `school_achievements_update` |
| `school_achievements` | `school_achievements_delete` |

as printed by Postgres:

```
EXISTS (SELECT 1 FROM user_role_assignments ura
        WHERE ura.user_id = auth.uid()
          AND ura.school_id = ura.school_id          <-- always true
          AND ura.department_id = ura.department_id) <-- always true
```

The source is `0022_write_scope.sql:218-219` and `0029_school_achievements.sql:62-63, 82-83, 99-100, 119-120`, where `school_id` and `department_id` are written **unqualified** inside a subquery that has an alias for the same columns. The inner scope wins, so both comparisons are self-comparisons.

What that costs:

- `circular_responses_insert`: the trailing exists() is defence-in-depth (the real gate is `is_circular_target(circular_id)`), but the row's `department_id` is **client-supplied and not validated against the caller's memberships**, so a legitimate responder can attribute a response to a department they do not belong to. That inflates the other department's compliance figure and, via FI-08's rotation, can clear its `is_latest` row.
- `school_achievements_*`: any school member passes the department test, so they can create/update/delete achievements attributed to any department in their school. Today `created_by = auth.uid()` still bounds update/delete to their own rows, and FI-04 makes the whole path unreachable anyway — but the intended scoping (D-3) is not what the policy says.

**Fix:** qualify the outer column, e.g. `ura.school_id = public.circular_responses.school_id and ura.department_id = public.circular_responses.department_id`, and add a battery check asserting a non-member department is rejected. This is a forward-only policy replacement, no data change.

---

#### FI-17 — Raw database messages bypass error redaction when wrapped in `AppError` (Medium)

`sanitizeError` (`src/lib/errors/sanitizeError.ts:35-38`) replaces the message of any plain `Error` with a generic string in production. But it returns `AppError` instances **unchanged** (`:21-27`), and `.message` is exactly what `formatActionErrorResult` sends to the client (`formatActionErrorResult.ts:31`).

24 sites wrap a database string in `AppError`:

```
src/actions/maintenance/createMaintenanceAction.ts:42      new AppError(res.error || …)
src/actions/maintenance/assignMaintenanceAction.ts:60
src/actions/maintenance/addMaintenanceNoteAction.ts:59
src/actions/circulars/createCircularAction.ts:44, :57
src/actions/circulars/updateCircularAction.ts:48
src/actions/circulars/deleteCircularAction.ts:22
src/actions/achievements/createAchievementAction.ts:32, :51
src/actions/achievements/updateAchievementAction.ts:33, :51
src/actions/achievements/deleteAchievementAction.ts:20
src/actions/calendar/createCalendarEventAction.ts:33, :61
src/actions/calendar/updateCalendarEventAction.ts:35, :55
src/actions/settings/createUserAction.ts:53
src/actions/settings/updateUserAction.ts:53
src/actions/settings/updateSchoolAction.ts:38, :49
src/actions/rbac/createRoleAction.ts:46
src/actions/rbac/deleteRoleAction.ts:33
```

`res.error` is `error.message` from a PostgREST response (`createMaintenanceRecord.ts:60`, `createCircularRecord.ts:52`, …), so a production user sees text like `duplicate key value violates unique constraint "circulars_ref_number_key"` — schema disclosure plus an untranslatable UI string.

Separately, 18 read helpers throw `new Error(\`Failed to fetch X: ${error.message}\`)`(e.g.`getSchoolCirculars.ts:26`, `getSchoolMaintenanceRequests.ts:36`, `getSchoolCalendarEvents.ts:36`). These are redacted in production by `sanitizeError`*if* they pass through it, but page-level fetchers reach`error.tsx` instead, where the development message is rendered and the production message depends on the boundary.

**Fix:** never construct `AppError` from a DB string. Use `mapDatabaseError(error)` (which already maps `23505` → `ConflictError` with a safe message), or pass a fixed message and attach the DB text to `cause` for the log only.

---

#### FI-18 — The "first active school" fallback is copy-pasted into six readers (Medium)

`src/lib/school/getFirstActiveSchoolId.ts` exists and documents the rule: resolve the fallback tenant **only after `isPlatformOwner()` returned true**, with the session client.

Six readers re-implement it inline, without the owner check:

| File                                                  | Lines    |
| ----------------------------------------------------- | -------- |
| `src/lib/school/getCurrentSchool.ts`                  | `:40-48` |
| `src/lib/achievements/getSchoolAchievements.ts`       | `:9-17`  |
| `src/lib/school/getSchoolDepartments.ts`              | `:14-22` |
| `src/lib/circulars/getSchoolCirculars.ts`             | `:7-15`  |
| `src/lib/maintenance/getSchoolMaintenanceRequests.ts` | `:9-17`  |
| `src/lib/calendar/getSchoolCalendarEvents.ts`         | `:9-17`  |

They also differ from the reference implementation: the helper orders by `created_at` and documents the intent; the copies use an unordered `.limit(1)`, so "the first active school" is whatever the planner returns.

Reach: `getCurrentSchool(profile.school_id)` is called by `assertCanManageCirculars` (`:25`) and `assertCanViewReports` (`:21`). For a caller with `school_id = null` — the platform owner, and any profile whose school was dissociated — the **application-level** authorization is performed against school #1.

Impact, stated precisely: the subsequent write is still refused by RLS (`circulars_insert` requires `has_permission('circular.create', school_id)`), so this is not a live cross-tenant breach. It is authorization-by-coincidence: the app decides "you are an admin of school #1" and the database is the only thing saying no. One policy relaxation away from being a breach, and today it produces a confusing generic error rather than "no school associated with your profile".

**Fix:** one helper, one rule — `resolveSchoolForCaller(profile)` returns `profile.school_id`, or `getFirstActiveSchoolId()` **only** when `isPlatformOwner(profile.id)` is true, otherwise `null`. Delete the six inline copies.

---

#### FI-19 — `rollbackProvisionedUser` ignores both failures (Medium)

`src/actions/settings/rollbackProvisionedUser.ts:12-14`:

```ts
await admin.from("profiles").delete().eq("id", userId);
await admin.auth.admin.deleteUser(userId);
```

Both results are discarded. This is the compensating action for a partially provisioned user (`createUserAction`). If either delete fails, the caller believes provisioning was rolled back while an orphaned profile or an orphaned auth user remains — the second is the dangerous one, because an auth user with no profile and no school is exactly the state the owner-bootstrap path treats specially.

**Fix:** check both, and on failure throw with the ids so the operator can reconcile; do not silently continue.

---

#### FI-20 — Two uploaders duplicate the rules the shared validator exists to own (Medium)

`src/lib/storage/validateStorageUpload.ts` was introduced so validation lives in one place. It has exactly one consumer (`uploadMaintenancePhoto`). Two uploaders still carry their own copies:

- `src/lib/calendar/uploadCalendarImage.ts:4-5, 13-28` — `ALLOWED_MIME`, `MAX_BYTES`, three literal messages, then a manual `hasValidFileSignature`.
- `src/lib/circulars/uploadCircularDocument.ts:5-6, 22-36` — same pattern, and it contradicts `circularDocumentRules.ts`, whose docstring claims "both the uploader and the circular actions validate against them".

Also: `uploadCalendarImage` writes to `public-assets/<school>/calendar/…` and is used for **achievement** images too (`createAchievementAction.ts:28`, `updateAchievementAction.ts:29`). The path folder and the permission that guards it (`calendar.manage`, per `0029`) happen to agree, so this works — but the name and folder lie about the content, and the next reader will assume achievement images live under an achievements folder.

**Fix:** both uploaders call `validateStorageUpload(file, rules)` with a per-bucket rules module; add `calendarImageRules` and reuse it for achievements (or rename the function to `uploadPublicAssetImage` with an explicit `folder` parameter).

---

#### FI-21 — Client-supplied enums are cast, not validated, and four columns are unconstrained text (Medium)

Every form parser casts a string to a TypeScript union with no runtime check:

| File                                                      | Values                      |
| --------------------------------------------------------- | --------------------------- |
| `src/lib/validation/parseCircularFormData.ts:19-20`       | `priority`, `response_type` |
| `src/lib/validation/parseMaintenanceFormData.ts:18-19`    | `category`, `priority`      |
| `src/lib/validation/parseCalendarFormData.ts:27,30`       | `category`, `visibility`    |
| `src/lib/validation/parseAchievementFormData.ts:19,21`    | `category`, `visibility`    |
| `src/lib/validation/parseMaintenanceTransitionData.ts:15` | `target_status`             |

Where the column is a Postgres enum (`circular_priority`, `maintenance_priority`, `calendar_visibility`, …) the DB rejects an unknown value — with `22P02`, which `mapDatabaseError` does not map, so it becomes a generic "Database operation failed". Where the column is `text`, the arbitrary value is **stored**:

| Table.column                     | Type   | Constraint |
| -------------------------------- | ------ | ---------- |
| `maintenance_requests.category`  | `text` | none       |
| `circulars.category`             | `text` | none       |
| `calendar_events.category`       | `text` | none       |
| `school_achievements.category`   | `text` | none       |
| `school_achievements.visibility` | `text` | none       |

A `visibility` value other than the literal `'public'` fails closed for anonymous reads (the policy compares `= 'public'`), so this is not a disclosure — but a stored unknown category renders as a missing translation key in the UI, and `school_achievements.visibility` being free text means nothing prevents a future `.neq('visibility','internal')` from being written against data that violates that assumption.

**Fix:** validate against the catalogue in the parser (return a `ValidationError` field error), and add `check` constraints for the four text columns in a forward migration.

---

#### FI-22 — Six dead authorization helpers that look authoritative (Medium)

Each of these is exported, unused, and looks like a control a reviewer would cite as evidence that the control exists:

| File                                          | Symbol                      | Why it matters                                                           |
| --------------------------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| `src/lib/rbac/assertPermission.ts`            | `assertPermission`          | a second, unwired permission gate                                        |
| `src/lib/auth/isSchoolManager.ts`             | `isSchoolManager`           | role-name-based manager test                                             |
| `src/lib/rbac/getUserRoleKey.ts`              | `getUserRoleKey`            | single-role assumption the catalog abandoned                             |
| `src/lib/backup/filterRowsForManager.ts`      | `filterRowsForManager`      | manager-scoped backup filtering that never runs                          |
| `src/lib/errors/withActionErrorHandler.ts`    | `withActionErrorHandler`    | a wrapper 25 actions do not use                                          |
| `src/lib/school/prepareUserProfilePayload.ts` | `prepareUserProfilePayload` | a second profile payload builder, superseded by `buildUserProfileUpdate` |

`assertCanManageBackup` (`src/lib/backup/assertCanManageBackup.ts:26-31`) is the same problem in live code: `allowed: isOwner` and `isManager: false` are hardcoded, so the `isManager` branch of the backup UI can never be true.

Two of these (`assertPermission`, `isSchoolManager`) are tested, which makes them look more real than they are.

**Fix:** delete all six, and either implement or remove `isManager` in `assertCanManageBackup`. If one of them is the intended future gate, wire it now — dead authorization code is worse than absent authorization code.

---

#### FI-23 — The M10 school-scoped permission list has no caller (Medium)

`0048:86` adds `effective_permission_keys(p_school uuid)`. `src/lib/rbac/getEffectivePermissions.ts:3-8` takes no parameter, and `hasPermission.ts` calls the boolean form `has_permission`. So the new overload would be unreachable API: more surface, no behaviour change, untested.

This is the same finding as the previous report's F-08, now confirmed at the function level: **no function in the codebase can pass a school to it.**

**Fix:** either add `schoolId` to `getEffectivePermissions` and thread it through the three auth helpers, or drop the overload.

---

### 2.4 Low

| ID        | Finding                                                                                                                                                                                                                                                                                       | Evidence                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **FI-24** | 22 genuinely dead exports beyond the six in FI-22 (of 57 flags; 35 are framework pages/barrels).                                                                                                                                                                                              | §5.1                                                                                                     |
| **FI-25** | 48 exports exceed 70 lines: 45 components, 3 lib modules. No file exceeds the 300-line cap, so RULE #1 holds.                                                                                                                                                                                 | §1.4                                                                                                     |
| **FI-26** | 3 `any`-typed report functions.                                                                                                                                                                                                                                                               | `applyCircularReportFilters.ts:3`, `applyMaintenanceReportFilters.ts:3`, `getMaintenanceReportData.ts:7` |
| **FI-27** | `select("*")` on two app-facing reads.                                                                                                                                                                                                                                                        | `getCircularById.ts:19`, `getUserNotifications.ts:4`                                                     |
| **FI-28** | `resolveNotificationHref` returns locale-less paths; `RealtimeNotificationListener.tsx:41` manually re-adds the locale (`router.push(\`/${locale}${href}\`)`) instead of using the typed router from `@/i18n`. With `localePrefix: "as-needed"`this produces`/ar/...` for the default locale. | `resolveNotificationHref.ts:5-7`                                                                         |
| **FI-29** | `themeColor` is hardcoded to the light/dark pair and ignores the four other themes; Tajawal declares only the `arabic` subset, so `en` falls back to a system face.                                                                                                                           | `src/app/[locale]/layout.tsx:37-40`, `:14-26`                                                            |
| **FI-30** | `assignUserRole` interpolates `schoolId` into a PostgREST `.or()` filter. The value is a DB-sourced UUID, so this is not injectable today, but it is the pattern that becomes injectable the day a slug is accepted.                                                                          | `src/lib/school/assignUserRole.ts:17`                                                                    |
| **FI-31** | `tailwind.config.js` is dead (Tailwind v4 CSS-first); `audit-report-2026-10-30.md` sits at the repo root.                                                                                                                                                                                     | previous report F-12, F-18                                                                               |
| **FI-32** | Docs: `backup_and_restore.md:63` says 119 checks (the battery's last full run: 132); the remediation plan still has no Phase 5 status block.                                                                                                                                                  | `docs/runbooks/backup_and_restore.md:63`                                                                 |

---

## 3. Frontend findings (`src/components/**`, `src/app/**`)

323 exports, all Tier B. The structural result is clean and worth stating plainly:

- **No component imports a Supabase client.** Every read comes from a server component or an action.
- **No component decides authorization** except by rendering what it is given (`canManage`, `isOwner` props). The one place where that prop is computed wrongly is FI-04.
- **0 hardcoded palette classes** (`bg-blue-500`, …) and 0 `white`/`black` literals in the whole tree.
- **0 components over 300 lines**; 41 exceed 70 lines inside one export, which is a complexity signal, not a rule violation.

Individual findings:

| ID    | Severity | Finding                                                                                                                                                                                                                                            | Evidence                                                                                             |
| ----- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| FI-33 | Medium   | `CreateAchievementForm` / `EditAchievementForm` / `AchievementDetailDialog` are reachable but their actions always fail (FI-04). The UI has no error affordance for a `ForbiddenError` — `res.error` is shown as a generic toast key.              | `CreateAchievementForm.tsx:26-33`, `EditAchievementForm.tsx:29-36`, `AchievementDetailDialog.tsx:39` |
| FI-34 | Low      | `AchievementCategoryBadge` indexes `useTranslations("achievements.categories")` by a DB value, so an unknown `category` renders a raw key — the user-visible half of FI-21.                                                                        | `AchievementCategoryBadge.tsx:11-20`                                                                 |
| FI-35 | Low      | `DashboardPage` renders achievements only for the owner (FI-04) and the compliance widget only when `canViewCompliance`, which `resolveDashboardPermissions` grants to `circular.create` holders — a permission that does not imply report access. | `dashboard/page.tsx:47`, `src/lib/dashboard/resolveDashboardPermissions.ts:16-17`                    |
| FI-36 | Low      | `Upload`-adjacent client forms do not pre-validate size/MIME, so the round trip is the only feedback path — and per FI-05 it currently returns success.                                                                                            | `CreateCircularForm.tsx`, `CreateAchievementForm.tsx`, `CreateCalendarEventForm.tsx`                 |

Nothing else in the 323 frontend exports required a change. The redesign is presentational, token-based, and wired; that conclusion from the previous report survives a function-level review.

---

## 4. What is verified healthy

Stated positively, because a report that only lists defects misleads about risk:

1. **Every server action has an authorization guard before its first write.** 11 flagged `NO_AUTH_GUARD` were false positives; each calls a module assert helper.
2. **Every school-owned write passes `school_id` from the session**, with the single exception of FI-13.
3. **No unknown RPC or table reference anywhere in `src`** — all names cross-checked against `pg_proc` / `pg_tables`.
4. **No file exceeds 300 lines** in `src/**/*.{ts,tsx}`.
5. **i18n parity is exact**: 711 keys in `en`, 711 in `ar`, zero missing in either direction.
6. **Backup/restore is upsert-only and table-scoped**; the DR runbook correctly points at `supabase db dump` rather than the JSON export.
7. **Storage read scope is decided by SQL** (`can_read_circular_attachment`, `can_read_maintenance_attachment`), not by client paths.
8. **`hasValidFileSignature` is correct** for all four accepted formats and fails closed on an unknown MIME.
9. **`mapDatabaseError` maps the five codes that matter** and never forwards the raw message — the leak in FI-17 is the `AppError` wrapper, not this function.
10. **The error pipeline preserves Next.js router errors** (`isNextRouterError` re-throws), so `redirect()` inside a `try` is not swallowed.

---

## 5. Appendix index

The full inventory (786 rows, one per unique export, with a verdict) is at the end of this document, grouped by module.

### 5.1 The 22 genuinely dead exports

```
src/components/auth/ClaimOwnerButton.tsx:8              ClaimOwnerButton
src/components/auth/SignOutButton.tsx:7                 SignOutButton
src/components/calendar/CalendarDayItemList.tsx:6       CalendarDayItemList
src/components/calendar/CalendarEventMetaFooter.tsx:7   CalendarEventMetaFooter
src/components/dashboard/DashboardHeader.tsx:7          DashboardHeader
src/components/public/PublicAboutSection.tsx:28         PublicAboutSection
src/components/public/PublicFeaturesSection.tsx:6       PublicFeaturesSection
src/components/public/PublicFooterContact.tsx:3         PublicFooterContact
src/components/settings/UserFormFields.tsx:24           UserFormFields
src/lib/auth/isSchoolManager.ts:3                       isSchoolManager            (FI-22)
src/lib/backup/filterRowsForManager.ts:5                filterRowsForManager       (FI-22)
src/lib/calendar/createCalendarEventRecord.ts:4         createCalendarEventRecord
src/lib/circulars/assertValidCircularDocuments.ts:12    assertValidCircularDocuments (FI-05)
src/lib/errors/withActionErrorHandler.ts:8              withActionErrorHandler     (FI-22)
src/lib/feedback/closeMessageBox.ts:3                   closeMessageBox
src/lib/maintenance/assertValidMaintenancePhoto.ts:13   assertValidMaintenancePhoto (FI-05)
src/lib/maintenance/types.ts:14                         MaintenanceCategory
src/lib/rbac/assertPermission.ts:3                      assertPermission            (FI-22)
src/lib/rbac/getUserRoleKey.ts:3                        getUserRoleKey             (FI-22)
src/lib/rbac/permissions.ts:21                          PermissionKey
src/lib/school/prepareUserProfilePayload.ts:1           prepareUserProfilePayload  (FI-22)
src/lib/validation/loginSchema.ts:8                     LoginInput
```

Note `createCalendarEventRecord` — the series creator `createCalendarEventSeries` is used instead, so the single-event path is dead. Confirm that was intentional before deleting; it is the only dead export whose removal would change capability.

---

## 6. Implementation plan

Order is chosen so that each work package leaves the tree in a state where the next one can be verified. Nothing touches the database before WP-1, because the RLS battery and `build` both need a green `tsc`.

### WP-1 — Green tree (Blocker) · ~45 min

1. `src/lib/storage/validateStorageUpload.ts` — discriminated union `{ ok: true; bytes } | { ok: false; error }`; update the three consumers.
2. `npx prettier --write` on the 37 files (see Q1), then `npm run format:check`.
3. Delete `tailwind.config.js`.
4. **Acceptance:** `npm run lint && npm run typecheck && npm run test && npm run build && npm run format:check` all exit 0; 331 tests still pass; `git diff -w --stat` for the formatting commit is empty.

### WP-2 — Repair `0048` (Blocker) · ~half a day

1. `drop function if exists public.effective_permission_keys();` before `0048:86`, re-issue grants.
2. Delete section 2 (`0048:40-48`), restoring `0036`'s owner-only `file_metadata_insert`.
3. Add `create unique index if not exists roles_key_unique on public.roles (key);` after confirming no duplicates on the live project.
4. Fix the operator trigger (FI-12) per Q3.
5. Decide M10 (FI-23) per Q6.
6. Rewrite the four tautological policies (FI-16) as a new forward-only migration that drops and recreates them with qualified outer columns — do **not** edit `0022`/`0029`.
7. Battery additions: no-arg `effective_permission_keys()` returns rows; a plain member cannot insert `file_metadata`; duplicate `roles.key` is rejected; unknown `circular_targets.role_key` is rejected; a mismatched department in `circular_responses` is rejected; deactivating an assignment clears `assigned_operator_id` (if Q3 = A).
8. **Verification (local, empty DB):** `supabase db reset` → `npm run test:rls` → `npm run test:e2e`. If Kong 502s on `/auth/v1/*` after reset, restart `supabase_kong_school-administration-portal` and wait ~8 s.
9. **Acceptance:** reset applies `0001`→`0048`; `\df public.effective_permission_keys` shows one signature; `select public.effective_permission_keys()` succeeds; battery green.

### WP-3 — Upload integrity (High, closes H-18) · ~1 day

1. `handleOptionalPhoto` and `handleCircularDocumentsUpload` return `{ error?: string }`; stop at the first failure.
2. Call `assertValidMaintenancePhoto` / `assertValidCircularDocuments` **before** the parent write in the four call sites (FI-05 table).
3. Replace `applyMaintenanceStatusChange`'s inline upload with the checked path and propagate.
4. Route `uploadCircularDocument` and `uploadCalendarImage` through `validateStorageUpload` with per-bucket rules (FI-20); add `calendarImageRules`.
5. Tests: validator rejects wrong MIME / oversize / signature mismatch; helper returns the uploader's error; a rejected photo leaves **no** `maintenance_requests` row; a second failed document is not attempted.
6. **Acceptance:** the new tests pass; both helpers are no longer assignable to `Promise<void>` (compile-time proof the error cannot be dropped).

### WP-4 — Achievements authorization (High) · ~half a day

1. `achievements/page.tsx:24-27` → `hasPermission("calendar.manage", profile.school_id) || isPlatformOwner(profile.id)`.
2. Delete `canRegisterAchievement.ts` and `assertCanRegisterAchievement.ts`; each of the three actions calls `hasPermission` directly and returns `schoolId`/`profileId` from `getCurrentProfile`.
3. `dashboard/page.tsx:47` → unconditional `getSchoolAchievements(schoolId)`, RLS filters.
4. Add a battery check: a `calendar.manage` holder in school A can insert `school_achievements` for school A and is rejected for school B.
5. **Acceptance:** a school-admin account can create, edit, and delete an achievement through the UI; a staff account sees the list and no create button; the owner sees the same as an admin.

### WP-5 — Mutation integrity (High/Medium) · ~1 day

1. `buildUserProfileUpdate` (FI-07): omit `is_active` when undefined.
2. `submitCircularResponseAction` (FI-08): move to a transactional RPC; propagate both errors.
3. `applyMaintenanceStatusChange` (FI-13): add `.eq("school_id", schoolId)`, select-and-count, check `insertMaintenanceUpdate`.
4. `saveMaintenanceAssignment` (FI-14): check the deactivation.
5. `rollbackProvisionedUser` (FI-19): check both deletes; throw with ids on failure.
6. `assertCanViewReports` (FI-15): derive `scopedDepartmentId` per Q7.
7. Tests: deactivated user stays deactivated after a name edit; a failed response insert preserves the previous `is_latest`; a foreign `requestId` returns an error, not success.
8. **Acceptance:** each of the seven has a test that fails before the fix and passes after.

### WP-6 — Error handling (Medium) · ~half a day

1. Replace all 24 `new AppError(res.error)` sites with `mapDatabaseError(res.error)` or a fixed message (FI-17).
2. Add `22P02` and `23514` to `mapDatabaseError` with safe messages.
3. Replace the three `.catch(() => [])` with propagation or a distinct `PERMISSIONS_UNAVAILABLE` code (FI-10).
4. Convert the 18 `throw new Error(\`…: ${db.message}\`)`read helpers to`mapDatabaseError` so the message is safe by construction.
5. **Acceptance:** a forced `23505` and a forced `42501` both produce a stable, non-DB message in the UI in production mode; no `error.message` from PostgREST reaches `formatActionErrorResult`.

### WP-7 — i18n and navigation (High for `en`) · ~half a day

1. Store `type` + `payload` for notifications instead of Arabic prose (FI-09); render in `NotificationItem` via `useTranslations`.
2. `RealtimeNotificationListener` uses the typed router from `@/i18n` (FI-28).
3. **Acceptance:** switching to `/en` shows English notification text for a new circular, reminder, and assignment; no server action contains a user-visible Arabic literal.

### WP-8 — Consolidation and dead code (Medium/Low) · ~half a day

1. Implement `resolveSchoolForCaller` and replace the six inline fallbacks (FI-18).
2. Delete the six dead helpers (FI-22) and the 16 remaining dead exports in §5.1 — after confirming `createCalendarEventRecord` is intentionally unused.
3. Fix `assertCanManageBackup`'s hardcoded `isManager` or remove the field.
4. Validate the five parser enums and add `check` constraints for the four text columns (FI-21).
5. **Acceptance:** `npx tsc --noEmit` clean after deletion; battery unchanged; no `is_active` fallback literal remains in `src`.

### WP-9 — Docs and record-keeping (Low) · ~20 min

1. Phase 5 status block in `docs/audits/2026-10-28-remediation-plan.md`.
2. `backup_and_restore.md:63` → 132, with a note that the battery prints its own total.
3. Cross-reference FI-01…FI-36 against the remediation plan; record FI-06 as "0036 reaffirmed".
4. Move `audit-report-2026-10-30.md` into `docs/audits/`.
5. **Acceptance:** the plan lists Phases 0–5 complete; the runbook number matches the last battery run.

### Out of scope for this batch

- Phase 6 (audit trail), Phase 7 (medium UX/a11y), Phase 8 (test architecture).
- Live-database verification and the Phase 3 DR drill — both blocked on the access token and the deployment target (Q9).
- Frontend polish beyond FI-33…FI-36.

---

## 7. Decisions required

| #   | Question                                              | Options                                                                              | Recommendation                                          |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Q1  | May `prettier --write` rewrite the 35 redesign files? | A: all 37 · B: only `validateStorageUpload.ts`                                       | **A**, as a whitespace-only commit                      |
| Q2  | Achievements audience — does D-3 still hold?          | A: `calendar.manage` only · B: also staff for their own department                   | **A** — it matches the existing RLS                     |
| Q3  | Who owns `maintenance_requests.assigned_operator_id`? | A: the trigger (remove the app write) · B: the app (drop the trigger)                | **A** — the DB is the boundary                          |
| Q4  | `roles.key` uniqueness                                | A: global unique · B: per-school unique + reserved list                              | **A** (six distinct keys today)                         |
| Q5  | `file_metadata_insert`                                | A: restore `0036` (owner-only) · B: keep the widened policy                          | **A**                                                   |
| Q6  | M10 `effective_permission_keys(p_school)`             | A: wire it through the three auth helpers · B: drop the overload                     | **A**                                                   |
| Q7  | Department-scoped reports                             | A: dept heads see their department only · B: `reports.view` always means school-wide | needs a product answer; today the field lies either way |
| Q8  | The six dead helpers                                  | A: delete · B: wire `assertPermission` as the single gate                            | **A** — one gate, not two                               |
| Q9  | Deployment target (D-8) and a `SUPABASE_ACCESS_TOKEN` | still open                                                                           | needed before any GO claim                              |

---

## 8. Definition of done

1. `npm run verify` exits 0.
2. `supabase db reset` applies `0001`→`0048`, and `\df public.effective_permission_keys` shows one signature.
3. `npm run test:rls` is green including the six new checks; `npm run test:e2e` is 8/8.
4. A school administrator can create, edit, and delete an achievement; a staff account cannot.
5. A rejected attachment leaves no `maintenance_requests` or `circulars` row — proven by test.
6. A deactivated user stays deactivated after an unrelated profile edit — proven by test.
7. A failed circular-response insert preserves the previous `is_latest` row — proven by test.
8. No PostgREST message reaches a production client.
9. `git diff -w --stat` for the formatting commit is empty.
10. No `is_active` literal fallback remains in `src`.

Until 1–3 hold, the verdict stays **NO-GO**.

---

## Appendix A — reproduction

```bash
# gates
npm run lint
npm run typecheck
npm run test
npm run build
npx prettier --check .
npm run scan:secrets

# 0048 ambiguity, local only, rolled back
docker exec -i supabase_db_school-administration-portal psql -U postgres -d postgres \
  -c "select proname, pg_get_function_identity_arguments(oid) from pg_proc where proname='effective_permission_keys';"

# roles.key uniqueness (absent)
docker exec -i supabase_db_school-administration-portal psql -U postgres -d postgres \
  -c "select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.roles'::regclass;"

# tautological policy predicates
docker exec -i supabase_db_school-administration-portal psql -U postgres -d postgres \
  -c "select tablename, policyname, cmd from pg_policies where schemaname='public' and (qual like '%ura.school_id = ura.school_id%' or with_check like '%ura.school_id = ura.school_id%');"

# unconstrained text columns
docker exec -i supabase_db_school-administration-portal psql -U postgres -d postgres \
  -c "select table_name, column_name, udt_name from information_schema.columns where table_schema='public' and column_name in ('category','visibility') and udt_name='text';"
```

## Appendix B — how to read the inventory

Each row is one exported symbol. `Lines` is the size of that export's body, not the file. `Verdict` is `OK`, `page` (Next.js framework entry, not called by name), or a finding id.

---

## Appendix C — full inventory

One row per exported symbol, de-duplicated (`export default async function` is matched twice by the extractor, so 34 duplicates were removed). `Body` is the size of that export's body in lines, not the file. Verdict `page` = a Next.js framework entry point that the framework calls by convention rather than by name; `barrel` = re-export only.

### `actions/achievements` — 5 exports

| Function                       | File:line                                              | Body | Verdict      |
| ------------------------------ | ------------------------------------------------------ | ---- | ------------ |
| `assertCanRegisterAchievement` | actions/achievements/assertCanRegisterAchievement.ts:4 | 22   | FI-04        |
| `canRegisterAchievement`       | actions/achievements/canRegisterAchievement.ts:3       | 10   | FI-04, FI-24 |
| `createAchievementAction`      | actions/achievements/createAchievementAction.ts:15     | 48   | FI-04, FI-17 |
| `deleteAchievementAction`      | actions/achievements/deleteAchievementAction.ts:12     | 20   | FI-04, FI-17 |
| `updateAchievementAction`      | actions/achievements/updateAchievementAction.ts:15     | 48   | FI-04, FI-17 |

### `actions/auth` — 7 exports

| Function                      | File:line                                     | Body | Verdict |
| ----------------------------- | --------------------------------------------- | ---- | ------- |
| `bootstrapPlatformOwnerClaim` | actions/auth/bootstrapPlatformOwnerClaim.ts:3 | 22   | OK      |
| `claimPlatformOwnerAction`    | actions/auth/claimPlatformOwnerAction.ts:9    | 26   | OK      |
| `loginAction`                 | actions/auth/loginAction.ts:7                 | 32   | OK      |
| `logoutAction`                | actions/auth/logoutAction.ts:6                | 6    | OK      |
| `requestPasswordResetAction`  | actions/auth/requestPasswordResetAction.ts:8  | 29   | OK      |
| `resetPasswordAction`         | actions/auth/resetPasswordAction.ts:7         | 31   | OK      |
| `validateBootstrapGuard`      | actions/auth/validateBootstrapGuard.ts:5      | 23   | OK      |

### `actions/backup` — 6 exports

| Function               | File:line                                 | Body | Verdict |
| ---------------------- | ----------------------------------------- | ---- | ------- |
| `ExportBackupResult`   | actions/backup/exportBackupAction.ts:13   | 4    | OK      |
| `exportBackupAction`   | actions/backup/exportBackupAction.ts:17   | 41   | OK      |
| `PreviewRestoreResult` | actions/backup/previewRestoreAction.ts:14 | 12   | OK      |
| `previewRestoreAction` | actions/backup/previewRestoreAction.ts:26 | 17   | OK      |
| `RestoreBackupResult`  | actions/backup/restoreBackupAction.ts:15  | 4    | OK      |
| `restoreBackupAction`  | actions/backup/restoreBackupAction.ts:19  | 57   | OK      |

### `actions/calendar` — 5 exports

| Function                     | File:line                                         | Body | Verdict |
| ---------------------------- | ------------------------------------------------- | ---- | ------- |
| `archiveCalendarEventAction` | actions/calendar/archiveCalendarEventAction.ts:10 | 26   | OK      |
| `cancelCalendarEventAction`  | actions/calendar/cancelCalendarEventAction.ts:10  | 28   | OK      |
| `createCalendarEventAction`  | actions/calendar/createCalendarEventAction.ts:16  | 60   | FI-17   |
| `publishCalendarEventAction` | actions/calendar/publishCalendarEventAction.ts:10 | 28   | OK      |
| `updateCalendarEventAction`  | actions/calendar/updateCalendarEventAction.ts:15  | 53   | FI-17   |

### `actions/circulars` — 8 exports

| Function                         | File:line                                              | Body | Verdict      |
| -------------------------------- | ------------------------------------------------------ | ---- | ------------ |
| `createCircularAction`           | actions/circulars/createCircularAction.ts:16           | 59   | FI-05, FI-17 |
| `deleteCircularAction`           | actions/circulars/deleteCircularAction.ts:12           | 21   | FI-17        |
| `deleteCircularAttachmentAction` | actions/circulars/deleteCircularAttachmentAction.ts:16 | 57   | OK           |
| `publishCircularAction`          | actions/circulars/publishCircularAction.ts:14          | 57   | FI-09        |
| `RemindCircularPayload`          | actions/circulars/remindCircularAction.ts:13           | 7    | OK           |
| `remindCircularAction`           | actions/circulars/remindCircularAction.ts:20           | 47   | FI-09        |
| `submitCircularResponseAction`   | actions/circulars/submitCircularResponseAction.ts:16   | 61   | FI-08        |
| `updateCircularAction`           | actions/circulars/updateCircularAction.ts:16           | 51   | FI-05, FI-17 |

### `actions/maintenance` — 4 exports

| Function                        | File:line                                               | Body | Verdict      |
| ------------------------------- | ------------------------------------------------------- | ---- | ------------ |
| `addMaintenanceNoteAction`      | actions/maintenance/addMaintenanceNoteAction.ts:17      | 53   | FI-17        |
| `assignMaintenanceAction`       | actions/maintenance/assignMaintenanceAction.ts:16       | 68   | FI-09, FI-17 |
| `createMaintenanceAction`       | actions/maintenance/createMaintenanceAction.ts:15       | 56   | FI-05, FI-17 |
| `updateMaintenanceStatusAction` | actions/maintenance/updateMaintenanceStatusAction.ts:18 | 61   | OK           |

### `actions/notifications` — 2 exports

| Function                         | File:line                                                  | Body | Verdict |
| -------------------------------- | ---------------------------------------------------------- | ---- | ------- |
| `markAllNotificationsReadAction` | actions/notifications/markAllNotificationsReadAction.ts:10 | 26   | OK      |
| `markNotificationReadAction`     | actions/notifications/markNotificationReadAction.ts:11     | 30   | OK      |

### `actions/rbac` — 7 exports

| Function                    | File:line                                   | Body | Verdict |
| --------------------------- | ------------------------------------------- | ---- | ------- |
| `assertCanDeleteRoleRecord` | actions/rbac/assertCanDeleteRoleRecord.ts:3 | 28   | OK      |
| `createRoleAction`          | actions/rbac/createRoleAction.ts:18         | 39   | FI-17   |
| `deleteRoleAction`          | actions/rbac/deleteRoleAction.ts:18         | 31   | FI-17   |
| `insertRoleRow`             | actions/rbac/insertRoleRow.ts:3             | 45   | OK      |
| `syncRolePermissions`       | actions/rbac/syncRolePermissions.ts:3       | 27   | OK      |
| `updateRoleAction`          | actions/rbac/updateRoleAction.ts:17         | 50   | OK      |
| `validateCreateRoleInput`   | actions/rbac/validateCreateRoleInput.ts:3   | 21   | OK      |

### `actions/settings` — 21 exports

| Function                       | File:line                                           | Body | Verdict |
| ------------------------------ | --------------------------------------------------- | ---- | ------- |
| `createDepartmentAction`       | actions/settings/createDepartmentAction.ts:14       | 38   | OK      |
| `createLocationAction`         | actions/settings/createLocationAction.ts:15         | 38   | OK      |
| `ProvisionAuthUserPayload`     | actions/settings/createProvisionedAuthUser.ts:3     | 6    | OK      |
| `createProvisionedAuthUser`    | actions/settings/createProvisionedAuthUser.ts:9     | 18   | OK      |
| `CreateUserInput`              | actions/settings/createUserAction.ts:16             | 9    | OK      |
| `createUserAction`             | actions/settings/createUserAction.ts:25             | 39   | FI-17   |
| `deleteDepartmentAction`       | actions/settings/deleteDepartmentAction.ts:14       | 41   | OK      |
| `deleteLocationAction`         | actions/settings/deleteLocationAction.ts:14         | 40   | OK      |
| `deleteUserAction`             | actions/settings/deleteUserAction.ts:24             | 31   | OK      |
| `ProvisionUserParams`          | actions/settings/provisionAuthUser.ts:6             | 11   | OK      |
| `provisionAuthUser`            | actions/settings/provisionAuthUser.ts:17            | 38   | OK      |
| `rollbackProvisionedUser`      | actions/settings/rollbackProvisionedUser.ts:7       | 8    | FI-19   |
| `toggleDepartmentStatusAction` | actions/settings/toggleDepartmentStatusAction.ts:13 | 34   | OK      |
| `toggleLocationStatusAction`   | actions/settings/toggleLocationStatusAction.ts:13   | 34   | OK      |
| `toggleUserActiveAction`       | actions/settings/toggleUserActiveAction.ts:20       | 56   | OK      |
| `updateDepartmentAction`       | actions/settings/updateDepartmentAction.ts:14       | 42   | OK      |
| `updateLocationAction`         | actions/settings/updateLocationAction.ts:15         | 42   | OK      |
| `updateSchoolAction`           | actions/settings/updateSchoolAction.ts:17           | 44   | FI-17   |
| `UpdateUserInput`              | actions/settings/updateUserAction.ts:19             | 12   | OK      |
| `updateUserAction`             | actions/settings/updateUserAction.ts:31             | 35   | FI-17   |
| `validateCreateUserInput`      | actions/settings/validateCreateUserInput.ts:1       | 39   | OK      |

### `lib/achievements` — 10 exports

| Function                  | File:line                                     | Body | Verdict |
| ------------------------- | --------------------------------------------- | ---- | ------- |
| `createAchievementRecord` | lib/achievements/createAchievementRecord.ts:4 | 28   | OK      |
| `deleteAchievementRecord` | lib/achievements/deleteAchievementRecord.ts:3 | 18   | OK      |
| `filterAchievements`      | lib/achievements/filterAchievements.ts:3      | 16   | OK      |
| `getSchoolAchievements`   | lib/achievements/getSchoolAchievements.ts:4   | 43   | FI-18   |
| `AchievementCategory`     | lib/achievements/types.ts:1                   | 3    | OK      |
| `AchievementVisibility`   | lib/achievements/types.ts:4                   | 2    | OK      |
| `SchoolAchievementRow`    | lib/achievements/types.ts:6                   | 25   | OK      |
| `CreateAchievementInput`  | lib/achievements/types.ts:31                  | 13   | OK      |
| `UpdateAchievementInput`  | lib/achievements/types.ts:44                  | 12   | OK      |
| `updateAchievementRecord` | lib/achievements/updateAchievementRecord.ts:4 | 28   | OK      |

### `lib/auth` — 16 exports

| Function                        | File:line                                   | Body | Verdict      |
| ------------------------------- | ------------------------------------------- | ---- | ------------ |
| `buildAuthRedirectUrl`          | lib/auth/buildAuthRedirectUrl.ts:12         | 5    | OK           |
| `ProfileRow`                    | lib/auth/getCurrentProfile.ts:4             | 13   | OK           |
| `getCurrentProfile`             | lib/auth/getCurrentProfile.ts:17            | 17   | OK           |
| `getPlatformOwnerUserIds`       | lib/auth/getPlatformOwnerUserIds.ts:3       | 15   | OK           |
| `getSessionUser`                | lib/auth/getSessionUser.ts:3                | 6    | OK           |
| `getUserInitials`               | lib/auth/getUserInitials.ts:1               | 11   | OK           |
| `hasAnyPlatformOwner`           | lib/auth/hasAnyPlatformOwner.ts:3           | 15   | OK           |
| `isCurrentUserPlatformOwner`    | lib/auth/isCurrentUserPlatformOwner.ts:8    | 5    | OK           |
| `isPlatformOwner`               | lib/auth/isPlatformOwner.ts:3               | 20   | OK           |
| `isSchoolManager`               | lib/auth/isSchoolManager.ts:3               | 23   | FI-22, FI-24 |
| `resolveDepartmentName`         | lib/auth/resolveDepartmentName.ts:3         | 12   | OK           |
| `resolveLayoutNavigationAccess` | lib/auth/resolveLayoutNavigationAccess.ts:1 | 26   | OK           |
| `resolveUserSubtitle`           | lib/auth/resolveUserSubtitle.ts:3           | 10   | OK           |
| `sanitizeNextPath`              | lib/auth/sanitizeNextPath.ts:11             | 12   | OK           |
| `RawProfileResult`              | lib/auth/toProfileRow.ts:3                  | 11   | OK           |
| `toProfileRow`                  | lib/auth/toProfileRow.ts:14                 | 19   | OK           |

### `lib/backup` — 35 exports

| Function                  | File:line                                | Body | Verdict                                |
| ------------------------- | ---------------------------------------- | ---- | -------------------------------------- |
| `assertBackupTenantScope` | lib/backup/assertBackupTenantScope.ts:28 | 24   | OK                                     |
| `BackupAccessResult`      | lib/backup/assertCanManageBackup.ts:4    | 9    | OK                                     |
| `assertCanManageBackup`   | lib/backup/assertCanManageBackup.ts:13   | 25   | OK                                     |
| `BackupExclusion`         | lib/backup/backupExclusions.ts:7         | 2    | OK                                     |
| `BACKUP_EXCLUSIONS`       | lib/backup/backupExclusions.ts:9         | 34   | OK                                     |
| `BACKUP_FORMAT_VERSION`   | lib/backup/backupFormatVersion.ts:2      | 2    | OK                                     |
| `backupSchema`            | lib/backup/backupSchema.ts:6             | 48   | OK                                     |
| `BackupTableSpec`         | lib/backup/backupTables.ts:9             | 6    | OK                                     |
| `BACKUP_TABLES`           | lib/backup/backupTables.ts:15            | 28   | OK                                     |
| `buildBackupManifest`     | lib/backup/buildBackupManifest.ts:11     | 31   | OK                                     |
| `computeBackupChecksum`   | lib/backup/computeBackupChecksum.ts:9    | 18   | OK                                     |
| `computeRestoreDiff`      | lib/backup/computeRestoreDiff.ts:12      | 26   | OK                                     |
| `countRestoreChanges`     | lib/backup/countRestoreChanges.ts:9      | 16   | OK                                     |
| `exportDatabaseBackup`    | lib/backup/exportDatabaseBackup.ts:16    | 37   | OK                                     |
| `fetchTableData`          | lib/backup/fetchTableData.ts:20          | 47   | OK (exporter: SELECT * is intentional) |
| `filterExcludedOwnerRows` | lib/backup/filterExcludedOwnerRows.ts:1  | 24   | OK                                     |
| `filterRowsForManager`    | lib/backup/filterRowsForManager.ts:5     | 33   | FI-22, FI-24                           |
| `MAX_BACKUP_BYTES`        | lib/backup/maxBackupBytes.ts:8           | 2    | OK                                     |
| `readAllPages`            | lib/backup/readAllPages.ts:15            | 19   | OK                                     |
| `readExistingRestoreKeys` | lib/backup/readExistingRestoreKeys.ts:15 | 26   | OK                                     |
| `resolveScopedRoleIds`    | lib/backup/resolveScopedRoleIds.ts:9     | 14   | OK                                     |
| `resolveTableScope`       | lib/backup/resolveTableScope.ts:8        | 13   | OK                                     |
| `restoreDatabaseBackup`   | lib/backup/restoreDatabaseBackup.ts:16   | 40   | OK                                     |
| `restoreKeyColumns`       | lib/backup/restoreKeyColumns.ts:5        | 7    | OK                                     |
| `restoreRowKey`           | lib/backup/restoreRowKey.ts:4            | 6    | OK                                     |
| `savePreRestoreSnapshot`  | lib/backup/savePreRestoreSnapshot.ts:13  | 26   | OK                                     |
| `BackupExclusion`         | lib/backup/types.ts:1                    | 2    | OK                                     |
| `BackupMetadata`          | lib/backup/types.ts:3                    | 14   | OK                                     |
| `DatabaseBackupPayload`   | lib/backup/types.ts:17                   | 23   | OK                                     |
| `RestoreSummary`          | lib/backup/types.ts:40                   | 11   | OK                                     |
| `RestoreDiff`             | lib/backup/types.ts:51                   | 7    | OK                                     |
| `validateBackupPayload`   | lib/backup/validateBackupPayload.ts:11   | 12   | OK                                     |
| `verifyBackupChecksum`    | lib/backup/verifyBackupChecksum.ts:10    | 12   | OK                                     |
| `BackupAuditInput`        | lib/backup/writeBackupAudit.ts:4         | 15   | OK                                     |
| `writeBackupAudit`        | lib/backup/writeBackupAudit.ts:19        | 20   | OK                                     |

### `lib/calendar` — 25 exports

| Function                         | File:line                                         | Body | Verdict      |
| -------------------------------- | ------------------------------------------------- | ---- | ------------ |
| `advanceRecurrenceDate`          | lib/calendar/advanceRecurrenceDate.ts:3           | 14   | OK           |
| `assertCanManageCalendar`        | lib/calendar/assertCanManageCalendar.ts:6         | 17   | OK           |
| `assertValidCalendarInput`       | lib/calendar/assertValidCalendarInput.ts:4        | 23   | OK           |
| `buildUnifiedCalendarItems`      | lib/calendar/buildUnifiedCalendarItems.ts:4       | 34   | OK           |
| `RecurrenceParams`               | lib/calendar/computeRecurringEventInstances.ts:7  | 8    | OK           |
| `computeRecurringEventInstances` | lib/calendar/computeRecurringEventInstances.ts:15 | 36   | OK           |
| `createCalendarEventRecord`      | lib/calendar/createCalendarEventRecord.ts:4       | 43   | FI-24        |
| `CreateCalendarSeriesParams`     | lib/calendar/createCalendarEventSeries.ts:4       | 14   | OK           |
| `createCalendarEventSeries`      | lib/calendar/createCalendarEventSeries.ts:18      | 38   | OK           |
| `formatDateTimeInput`            | lib/calendar/formatDateTimeInput.ts:1             | 15   | OK           |
| `getCalendarEventById`           | lib/calendar/getCalendarEventById.ts:4            | 22   | OK           |
| `getPublicCalendarEvents`        | lib/calendar/getPublicCalendarEvents.ts:4         | 29   | OK           |
| `getSchoolCalendarEvents`        | lib/calendar/getSchoolCalendarEvents.ts:4         | 36   | FI-17, FI-18 |
| `isWeekendDay`                   | lib/calendar/isWeekendDay.ts:1                    | 8    | OK           |
| `parseRecurrenceDates`           | lib/calendar/parseRecurrenceDates.ts:1            | 16   | OK           |
| `parseUntilTimestamp`            | lib/calendar/parseUntilTimestamp.ts:1             | 12   | OK           |
| `resolveRecurrenceLimits`        | lib/calendar/resolveRecurrenceLimits.ts:4         | 13   | OK           |
| `CalendarVisibility`             | lib/calendar/types.ts:3                           | 2    | OK           |
| `CalendarStatus`                 | lib/calendar/types.ts:5                           | 2    | OK           |
| `CalendarCategory`               | lib/calendar/types.ts:7                           | 3    | OK           |
| `CalendarRecurrenceFrequency`    | lib/calendar/types.ts:10                          | 2    | OK           |
| `CalendarEventRow`               | lib/calendar/types.ts:12                          | 25   | OK           |
| `UnifiedCalendarItem`            | lib/calendar/types.ts:37                          | 14   | OK           |
| `updateCalendarEventRecord`      | lib/calendar/updateCalendarEventRecord.ts:4       | 42   | OK           |
| `uploadCalendarImage`            | lib/calendar/uploadCalendarImage.ts:7             | 32   | FI-20        |

### `lib/circulars` — 50 exports

| Function                          | File:line                                          | Body | Verdict      |
| --------------------------------- | -------------------------------------------------- | ---- | ------------ |
| `ManageCircularAuthResult`        | lib/circulars/assertCanManageCirculars.ts:6        | 14   | OK           |
| `assertCanManageCirculars`        | lib/circulars/assertCanManageCirculars.ts:20       | 16   | OK           |
| `assertValidCircularDocuments`    | lib/circulars/assertValidCircularDocuments.ts:12   | 11   | FI-05, FI-24 |
| `buildCircularReminderBody`       | lib/circulars/buildCircularReminderBody.ts:1       | 15   | OK           |
| `buildResponseItems`              | lib/circulars/buildResponseItems.ts:4              | 15   | OK           |
| `canRespondToCircular`            | lib/circulars/canRespondToCircular.ts:4            | 13   | OK           |
| `circularDocumentRules`           | lib/circulars/circularDocumentRules.ts:7           | 8    | FI-05        |
| `createCircularRecord`            | lib/circulars/createCircularRecord.ts:4            | 44   | OK           |
| `deleteCircularRecord`            | lib/circulars/deleteCircularRecord.ts:3            | 43   | OK           |
| `downloadAttachmentFile`          | lib/circulars/downloadAttachmentFile.ts:1          | 22   | OK           |
| `CircularFilterOptions`           | lib/circulars/filterCirculars.ts:3                 | 7    | OK           |
| `filterCirculars`                 | lib/circulars/filterCirculars.ts:10                | 30   | OK           |
| `formatAttachmentFileName`        | lib/circulars/formatAttachmentFileName.ts:1        | 6    | OK           |
| `formatCircularDate`              | lib/circulars/formatCircularDate.ts:1              | 12   | OK           |
| `AttachmentKind`                  | lib/circulars/getAttachmentKind.ts:1               | 2    | OK           |
| `getAttachmentKind`               | lib/circulars/getAttachmentKind.ts:3               | 11   | OK           |
| `getCircularAttachments`          | lib/circulars/getCircularAttachments.ts:4          | 28   | OK           |
| `CircularDetail`                  | lib/circulars/getCircularById.ts:6                 | 13   | OK           |
| `getCircularById`                 | lib/circulars/getCircularById.ts:19                | 29   | OK           |
| `DepartmentResponseStatus`        | lib/circulars/getCircularDepartmentStatuses.ts:5   | 7    | OK           |
| `getCircularDepartmentStatuses`   | lib/circulars/getCircularDepartmentStatuses.ts:12  | 25   | OK           |
| `CircularPagePermissions`         | lib/circulars/getCircularPermissions.ts:1          | 14   | OK           |
| `getCircularPermissions`          | lib/circulars/getCircularPermissions.ts:15         | 9    | OK           |
| `getCircularReminderMeta`         | lib/circulars/getCircularReminderMeta.ts:3         | 20   | OK           |
| `getCircularReminderRecipients`   | lib/circulars/getCircularReminderRecipients.ts:5   | 44   | OK           |
| `getCircularResponses`            | lib/circulars/getCircularResponses.ts:19           | 32   | OK           |
| `getDepartmentMemberUserIds`      | lib/circulars/getDepartmentMemberUserIds.ts:3      | 17   | OK           |
| `getPendingCircularDepartmentIds` | lib/circulars/getPendingCircularDepartmentIds.ts:3 | 23   | OK           |
| `getSchoolCirculars`              | lib/circulars/getSchoolCirculars.ts:4              | 40   | FI-17, FI-18 |
| `handleCircularDocumentsUpload`   | lib/circulars/handleCircularDocumentsUpload.ts:4   | 22   | FI-05        |
| `insertCircularAttachment`        | lib/circulars/insertCircularAttachment.ts:3        | 24   | OK           |
| `insertCircularTargets`           | lib/circulars/insertCircularTargets.ts:11          | 22   | OK           |
| `ResponseRowDisplay`              | lib/circulars/prepareResponseRowDisplay.ts:5       | 10   | OK           |
| `prepareResponseRowDisplay`       | lib/circulars/prepareResponseRowDisplay.ts:15      | 32   | OK           |
| `printAttachment`                 | lib/circulars/printAttachment.ts:1                 | 50   | OK           |
| `resolveResponseBadgeVariant`     | lib/circulars/resolveResponseBadgeVariant.ts:1     | 12   | OK           |
| `revalidateCircularReminderPaths` | lib/circulars/revalidateCircularReminderPaths.ts:3 | 8    | OK           |
| `shouldShowCircularReminder`      | lib/circulars/shouldShowCircularReminder.ts:8      | 9    | OK           |
| `CircularSortField`               | lib/circulars/sortCirculars.ts:3                   | 46   | OK           |
| `sortCirculars`                   | lib/circulars/sortCirculars.ts:49                  | 9    | OK           |
| `CircularPriority`                | lib/circulars/types.ts:1                           | 2    | OK           |
| `CircularStatus`                  | lib/circulars/types.ts:3                           | 3    | OK           |
| `CircularResponseType`            | lib/circulars/types.ts:6                           | 2    | OK           |
| `CircularResponseStatus`          | lib/circulars/types.ts:8                           | 3    | OK           |
| `CircularRow`                     | lib/circulars/types.ts:11                          | 21   | OK           |
| `CircularAttachmentRow`           | lib/circulars/types.ts:32                          | 12   | OK           |
| `CircularTargetRow`               | lib/circulars/types.ts:44                          | 9    | OK           |
| `CircularResponseRow`             | lib/circulars/types.ts:53                          | 15   | OK           |
| `updateCircularRecord`            | lib/circulars/updateCircularRecord.ts:5            | 65   | OK           |
| `uploadCircularDocument`          | lib/circulars/uploadCircularDocument.ts:8          | 45   | FI-20        |

### `lib/cron` — 3 exports

| Function                | File:line                           | Body | Verdict |
| ----------------------- | ----------------------------------- | ---- | ------- |
| `CronAuthResult`        | lib/cron/assertCronAuthorized.ts:3  | 14   | OK      |
| `assertCronAuthorized`  | lib/cron/assertCronAuthorized.ts:17 | 24   | OK      |
| `timingSafeEqualString` | lib/cron/timingSafeEqualString.ts:9 | 9    | OK      |

### `lib/dashboard` — 13 exports

| Function                             | File:line                                         | Body | Verdict |
| ------------------------------------ | ------------------------------------------------- | ---- | ------- |
| `DonutSegment`                       | lib/dashboard/computeDonutSegments.ts:3           | 10   | OK      |
| `computeDonutSegments`               | lib/dashboard/computeDonutSegments.ts:13          | 27   | OK      |
| `DONUT_PALETTE`                      | lib/dashboard/donutPalette.ts:1                   | 13   | OK      |
| `getDashboardComplianceData`         | lib/dashboard/getDashboardComplianceData.ts:9     | 56   | OK      |
| `resolveCircularSlices`              | lib/dashboard/resolveCircularSlices.ts:3          | 21   | OK      |
| `DashboardPermissions`               | lib/dashboard/resolveDashboardPermissions.ts:1    | 7    | OK      |
| `resolveDashboardPermissions`        | lib/dashboard/resolveDashboardPermissions.ts:8    | 13   | OK      |
| `SelectedComplianceView`             | lib/dashboard/resolveSelectedComplianceView.ts:9  | 8    | OK      |
| `resolveSelectedComplianceView`      | lib/dashboard/resolveSelectedComplianceView.ts:17 | 28   | OK      |
| `DashboardComplianceDeptBadge`       | lib/dashboard/types.ts:1                          | 5    | OK      |
| `DashboardComplianceCircularItem`    | lib/dashboard/types.ts:6                          | 11   | OK      |
| `DashboardDepartmentComplianceSlice` | lib/dashboard/types.ts:17                         | 10   | OK      |
| `DashboardComplianceData`            | lib/dashboard/types.ts:27                         | 10   | OK      |

### `lib/env` — 7 exports

| Function          | File:line                    | Body | Verdict |
| ----------------- | ---------------------------- | ---- | ------- |
| `clientEnvSchema` | lib/env/clientEnvSchema.ts:3 | 5    | OK      |
| `formatEnvIssues` | lib/env/formatEnvIssues.ts:3 | 6    | OK      |
| `ClientEnv`       | lib/env/getClientEnv.ts:5    | 2    | OK      |
| `getClientEnv`    | lib/env/getClientEnv.ts:7    | 17   | OK      |
| `ServerEnv`       | lib/env/getServerEnv.ts:5    | 2    | OK      |
| `getServerEnv`    | lib/env/getServerEnv.ts:7    | 10   | OK      |
| `serverEnvSchema` | lib/env/serverEnvSchema.ts:5 | 11   | OK      |

### `lib/errors` — 26 exports

| Function                  | File:line                                | Body | Verdict |
| ------------------------- | ---------------------------------------- | ---- | ------- |
| `AppErrorOptions`         | lib/errors/AppError.ts:3                 | 9    | OK      |
| `AppError`                | lib/errors/AppError.ts:12                | 26   | OK      |
| `AuthenticationError`     | lib/errors/AuthenticationError.ts:4      | 12   | OK      |
| `ConflictError`           | lib/errors/ConflictError.ts:4            | 12   | OK      |
| `DatabaseError`           | lib/errors/DatabaseError.ts:4            | 13   | OK      |
| `ERROR_CODES`             | lib/errors/errorCodes.ts:1               | 13   | OK      |
| `ErrorCode`               | lib/errors/errorCodes.ts:14              | 2    | OK      |
| `ForbiddenError`          | lib/errors/ForbiddenError.ts:4           | 12   | OK      |
| `ActionErrorResult`       | lib/errors/formatActionErrorResult.ts:4  | 8    | OK      |
| `ActionSuccessResult`     | lib/errors/formatActionErrorResult.ts:12 | 5    | OK      |
| `ActionResult`            | lib/errors/formatActionErrorResult.ts:17 | 2    | OK      |
| `formatActionErrorResult` | lib/errors/formatActionErrorResult.ts:19 | 12   | OK      |
| `ApiErrorBody`            | lib/errors/formatApiErrorResponse.ts:4   | 10   | OK      |
| `formatApiErrorResponse`  | lib/errors/formatApiErrorResponse.ts:14  | 22   | OK      |
| `isAppError`              | lib/errors/isAppError.ts:3               | 4    | OK      |
| `isNextRouterError`       | lib/errors/isNextRouterError.ts:1        | 13   | OK      |
| `mapDatabaseError`        | lib/errors/mapDatabaseError.ts:15        | 25   | OK      |
| `NetworkError`            | lib/errors/NetworkError.ts:4             | 13   | OK      |
| `NotFoundError`           | lib/errors/NotFoundError.ts:4            | 12   | OK      |
| `RateLimitError`          | lib/errors/RateLimitError.ts:4           | 12   | OK      |
| `sanitizeError`           | lib/errors/sanitizeError.ts:9            | 47   | OK      |
| `ValidationError`         | lib/errors/ValidationError.ts:4          | 20   | OK      |
| `ServerAction`            | lib/errors/withActionErrorHandler.ts:4   | 4    | OK      |
| `withActionErrorHandler`  | lib/errors/withActionErrorHandler.ts:8   | 17   | OK      |
| `ApiRouteHandler`         | lib/errors/withApiErrorHandler.ts:4      | 5    | OK      |
| `withApiErrorHandler`     | lib/errors/withApiErrorHandler.ts:9      | 24   | OK      |

### `lib/feedback` — 14 exports

| Function               | File:line                              | Body | Verdict |
| ---------------------- | -------------------------------------- | ---- | ------- |
| `cancelMessageBox`     | lib/feedback/cancelMessageBox.ts:3     | 4    | OK      |
| `closeMessageBox`      | lib/feedback/closeMessageBox.ts:3      | 4    | FI-24   |
| `confirmMessageBox`    | lib/feedback/confirmMessageBox.ts:3    | 4    | OK      |
| `extractMessageText`   | lib/feedback/extractMessageText.ts:1   | 8    | OK      |
| `MessageBoxTheme`      | lib/feedback/getMessageBoxTheme.ts:3   | 8    | OK      |
| `getMessageBoxTheme`   | lib/feedback/getMessageBoxTheme.ts:11  | 42   | OK      |
| `initMessageBoxBridge` | lib/feedback/initMessageBoxBridge.ts:7 | 29   | OK      |
| `messageBoxStore`      | lib/feedback/messageBoxStore.ts:17     | 62   | OK      |
| `showConfirmBox`       | lib/feedback/showConfirmBox.ts:4       | 19   | OK      |
| `showMessageBox`       | lib/feedback/showMessageBox.ts:4       | 4    | OK      |
| `MessageBoxType`       | lib/feedback/types.ts:1                | 2    | OK      |
| `MessageBoxOptions`    | lib/feedback/types.ts:3                | 11   | OK      |
| `MessageBoxState`      | lib/feedback/types.ts:14               | 5    | OK      |
| `useMessageBoxState`   | lib/feedback/useMessageBoxState.ts:13  | 8    | OK      |

### `lib/health` — 1 export

| Function          | File:line                       | Body | Verdict |
| ----------------- | ------------------------------- | ---- | ------- |
| `getBuildVersion` | lib/health/getBuildVersion.ts:9 | 9    | OK      |

### `lib/logger` — 16 exports

| Function                      | File:line                                    | Body | Verdict |
| ----------------------------- | -------------------------------------------- | ---- | ------- |
| `buildErrorLogPayload`        | lib/logger/buildErrorLogPayload.ts:5         | 21   | OK      |
| `createCorrelationId`         | lib/logger/createCorrelationId.ts:1          | 6    | OK      |
| `isDuplicateClientError`      | lib/logger/isDuplicateClientError.ts:13      | 11   | OK      |
| `LogContext`                  | lib/logger/logError.ts:3                     | 2    | OK      |
| `logError`                    | lib/logger/logError.ts:5                     | 14   | OK      |
| `redactSensitiveData`         | lib/logger/redactSensitiveData.ts:19         | 21   | OK      |
| `ClientErrorSource`           | lib/logger/reportClientError.ts:5            | 9    | OK      |
| `reportClientError`           | lib/logger/reportClientError.ts:14           | 20   | OK      |
| `reportError`                 | lib/logger/reportError.ts:13                 | 17   | OK      |
| `reportErrorToSink`           | lib/logger/reportErrorToSink.ts:11           | 22   | OK      |
| `resolveClientErrorReference` | lib/logger/resolveClientErrorReference.ts:13 | 17   | OK      |
| `ErrorDetails`                | lib/logger/resolveErrorDetails.ts:3          | 12   | OK      |
| `resolveErrorDetails`         | lib/logger/resolveErrorDetails.ts:15         | 13   | OK      |
| `sanitizeLogString`           | lib/logger/sanitizeLogString.ts:5            | 11   | OK      |
| `ClientErrorPayload`          | lib/logger/sendClientErrorReport.ts:1        | 16   | OK      |
| `sendClientErrorReport`       | lib/logger/sendClientErrorReport.ts:17       | 16   | OK      |

### `lib/maintenance` — 35 exports

| Function                       | File:line                                         | Body | Verdict      |
| ------------------------------ | ------------------------------------------------- | ---- | ------------ |
| `applyMaintenanceStatusChange` | lib/maintenance/applyMaintenanceStatusChange.ts:8 | 46   | FI-05, FI-13 |
| `assertCanAddNote`             | lib/maintenance/assertCanAddNote.ts:3             | 12   | OK           |
| `assertCanAssignMaintenance`   | lib/maintenance/assertCanAssignMaintenance.ts:6   | 17   | OK           |
| `assertCanCreateMaintenance`   | lib/maintenance/assertCanCreateMaintenance.ts:6   | 22   | OK           |
| `assertCanTransitionStatus`    | lib/maintenance/assertCanTransitionStatus.ts:5    | 13   | OK           |
| `assertTransitionReason`       | lib/maintenance/assertTransitionReason.ts:3       | 14   | OK           |
| `assertTransitionRole`         | lib/maintenance/assertTransitionRole.ts:5         | 19   | OK           |
| `assertValidMaintenancePhoto`  | lib/maintenance/assertValidMaintenancePhoto.ts:13 | 9    | FI-05, FI-24 |
| `buildStatusUpdatePayload`     | lib/maintenance/buildStatusUpdatePayload.ts:3     | 21   | OK           |
| `canReopenTicket`              | lib/maintenance/canReopenTicket.ts:1              | 8    | OK           |
| `createMaintenanceRecord`      | lib/maintenance/createMaintenanceRecord.ts:4      | 50   | OK           |
| `filterMaintenanceTickets`     | lib/maintenance/filterMaintenanceTickets.ts:5     | 8    | OK           |
| `formatLocation`               | lib/maintenance/formatLocation.ts:1               | 14   | OK           |
| `getMaintenanceAttachments`    | lib/maintenance/getMaintenanceAttachments.ts:4    | 29   | OK           |
| `getMaintenanceOperators`      | lib/maintenance/getMaintenanceOperators.ts:3      | 5    | OK           |
| `getMaintenanceRequestById`    | lib/maintenance/getMaintenanceRequestById.ts:4    | 27   | OK           |
| `getMaintenanceUpdates`        | lib/maintenance/getMaintenanceUpdates.ts:4        | 20   | OK           |
| `getSchoolMaintenanceRequests` | lib/maintenance/getSchoolMaintenanceRequests.ts:4 | 40   | FI-17, FI-18 |
| `handleOptionalPhoto`          | lib/maintenance/handleOptionalPhoto.ts:4          | 21   | FI-05        |
| `insertMaintenanceAttachment`  | lib/maintenance/insertMaintenanceAttachment.ts:3  | 26   | OK           |
| `insertMaintenanceUpdate`      | lib/maintenance/insertMaintenanceUpdate.ts:3      | 26   | FI-13        |
| `isLegalTransition`            | lib/maintenance/isLegalTransition.ts:15           | 8    | OK           |
| `isOperatorStatusAllowed`      | lib/maintenance/isOperatorStatusAllowed.ts:3      | 7    | OK           |
| `maintenancePhotoRules`        | lib/maintenance/maintenancePhotoRules.ts:7        | 8    | OK           |
| `matchesMaintenanceSearch`     | lib/maintenance/matchesMaintenanceSearch.ts:3     | 11   | OK           |
| `matchesMaintenanceStatus`     | lib/maintenance/matchesMaintenanceStatus.ts:3     | 12   | OK           |
| `resolveCategoryLabel`         | lib/maintenance/resolveCategoryLabel.ts:1         | 8    | OK           |
| `saveMaintenanceAssignment`    | lib/maintenance/saveMaintenanceAssignment.ts:5    | 61   | FI-14        |
| `MaintenancePriority`          | lib/maintenance/types.ts:1                        | 2    | OK           |
| `MaintenanceStatus`            | lib/maintenance/types.ts:3                        | 11   | OK           |
| `MaintenanceCategory`          | lib/maintenance/types.ts:14                       | 3    | FI-24        |
| `MaintenanceRequestRow`        | lib/maintenance/types.ts:17                       | 48   | OK           |
| `MaintenanceUpdateRow`         | lib/maintenance/types.ts:65                       | 16   | OK           |
| `MaintenanceAttachmentRow`     | lib/maintenance/types.ts:81                       | 13   | OK           |
| `uploadMaintenancePhoto`       | lib/maintenance/uploadMaintenancePhoto.ts:6       | 41   | FI-01, FI-05 |

### `lib/notifications` — 12 exports

| Function                     | File:line                                          | Body | Verdict |
| ---------------------------- | -------------------------------------------------- | ---- | ------- |
| `createNotificationRecord`   | lib/notifications/createNotificationRecord.ts:5    | 30   | OK      |
| `DispatchNotificationResult` | lib/notifications/dispatchModuleNotification.ts:6  | 14   | OK      |
| `dispatchModuleNotification` | lib/notifications/dispatchModuleNotification.ts:20 | 66   | OK      |
| `getUnreadNotificationCount` | lib/notifications/getUnreadNotificationCount.ts:3  | 15   | OK      |
| `getUserNotifications`       | lib/notifications/getUserNotifications.ts:4        | 16   | FI-27   |
| `isNotificationThrottled`    | lib/notifications/isNotificationThrottled.ts:5     | 24   | OK      |
| `resolveNotificationHref`    | lib/notifications/resolveNotificationHref.ts:3     | 8    | FI-28   |
| `shouldThrottleNotification` | lib/notifications/shouldThrottleNotification.ts:1  | 14   | OK      |
| `NotificationType`           | lib/notifications/types.ts:1                       | 2    | OK      |
| `NotificationEntityKind`     | lib/notifications/types.ts:3                       | 2    | OK      |
| `NotificationRow`            | lib/notifications/types.ts:5                       | 13   | OK      |
| `CreateNotificationInput`    | lib/notifications/types.ts:18                      | 11   | OK      |

### `lib/pwa` — 1 export

| Function            | File:line                      | Body | Verdict |
| ------------------- | ------------------------------ | ---- | ------- |
| `purgeClientCaches` | lib/pwa/purgeClientCaches.ts:6 | 20   | OK      |

### `lib/rateLimit` — 4 exports

| Function                       | File:line                                       | Body | Verdict |
| ------------------------------ | ----------------------------------------------- | ---- | ------- |
| `consumeRateLimitToken`        | lib/rateLimit/consumeRateLimitToken.ts:13       | 20   | OK      |
| `pruneExpiredRateLimitBuckets` | lib/rateLimit/pruneExpiredRateLimitBuckets.ts:9 | 8    | OK      |
| `RateLimitBucket`              | lib/rateLimit/rateLimitBuckets.ts:1             | 8    | OK      |
| `rateLimitBuckets`             | lib/rateLimit/rateLimitBuckets.ts:9             | 2    | OK      |

### `lib/rbac` — 15 exports

| Function                  | File:line                             | Body | Verdict      |
| ------------------------- | ------------------------------------- | ---- | ------------ |
| `assertPermission`        | lib/rbac/assertPermission.ts:3        | 6    | FI-22, FI-24 |
| `RolePermItem`            | lib/rbac/buildRoleMaps.ts:1           | 5    | OK           |
| `RoleAssignmentItem`      | lib/rbac/buildRoleMaps.ts:6           | 4    | OK           |
| `buildRoleMaps`           | lib/rbac/buildRoleMaps.ts:10          | 16   | OK           |
| `can`                     | lib/rbac/can.ts:1                     | 4    | OK           |
| `getEffectivePermissions` | lib/rbac/getEffectivePermissions.ts:3 | 7    | FI-10, FI-23 |
| `SchoolRoleRow`           | lib/rbac/getSchoolRoles.ts:4          | 11   | OK           |
| `getSchoolRoles`          | lib/rbac/getSchoolRoles.ts:15         | 37   | OK           |
| `getUserRoleKey`          | lib/rbac/getUserRoleKey.ts:3          | 18   | FI-22, FI-24 |
| `hasPermission`           | lib/rbac/hasPermission.ts:3           | 15   | OK           |
| `PermissionCatalogItem`   | lib/rbac/permissionCatalog.ts:1       | 14   | OK           |
| `PERMISSION_CATALOG`      | lib/rbac/permissionCatalog.ts:15      | 99   | OK           |
| `PERMISSION_KEYS`         | lib/rbac/permissions.ts:2             | 19   | OK           |
| `PermissionKey`           | lib/rbac/permissions.ts:21            | 2    | OK           |
| `resolveRoleDisplayName`  | lib/rbac/resolveRoleDisplayName.ts:1  | 24   | OK           |

### `lib/reports` — 36 exports

| Function                        | File:line                                      | Body | Verdict |
| ------------------------------- | ---------------------------------------------- | ---- | ------- |
| `applyCircularReportFilters`    | lib/reports/applyCircularReportFilters.ts:3    | 14   | FI-26   |
| `applyMaintenanceReportFilters` | lib/reports/applyMaintenanceReportFilters.ts:3 | 14   | FI-26   |
| `AssertCanViewReportsResult`    | lib/reports/assertCanViewReports.ts:6          | 9    | OK      |
| `assertCanViewReports`          | lib/reports/assertCanViewReports.ts:15         | 30   | OK      |
| `buildCircularsCsv`             | lib/reports/buildCircularsCsv.ts:4             | 34   | OK      |
| `buildCsvDocument`              | lib/reports/buildCsvDocument.ts:3              | 7    | OK      |
| `buildMaintenanceCsv`           | lib/reports/buildMaintenanceCsv.ts:4           | 32   | OK      |
| `computeAverageResolutionTime`  | lib/reports/computeAverageResolutionTime.ts:1  | 16   | OK      |
| `computeDepartmentCompliance`   | lib/reports/computeDepartmentCompliance.ts:15  | 50   | OK      |
| `computeTicketResolutionHours`  | lib/reports/computeTicketResolutionHours.ts:1  | 9    | OK      |
| `escapeCsvCell`                 | lib/reports/escapeCsvCell.ts:3                 | 20   | OK      |
| `extractActiveOperatorName`     | lib/reports/extractActiveOperatorName.ts:1     | 8    | OK      |
| `extractTicketDepartment`       | lib/reports/extractTicketDepartment.ts:1       | 10   | OK      |
| `filterAndSortCirculars`        | lib/reports/filterAndSortCirculars.ts:4        | 63   | OK      |
| `filterAndSortMaintenance`      | lib/reports/filterAndSortMaintenance.ts:15     | 51   | OK      |
| `filterAndSortReportData`       | lib/reports/filterAndSortReportData.ts:9       | 14   | OK      |
| `formatCsvRow`                  | lib/reports/formatCsvRow.ts:3                  | 4    | OK      |
| `getCircularsReportData`        | lib/reports/getCircularsReportData.ts:8        | 90   | OK      |
| `getMaintenanceReportData`      | lib/reports/getMaintenanceReportData.ts:7      | 59   | FI-26   |
| `mapCircularReportRows`         | lib/reports/mapCircularReportRows.ts:25        | 50   | OK      |
| `mapMaintenanceReportRows`      | lib/reports/mapMaintenanceReportRows.ts:4      | 17   | OK      |
| `matchesCustomDateRange`        | lib/reports/matchesCustomDateRange.ts:1        | 13   | OK      |
| `matchesDateFilter`             | lib/reports/matchesDateFilter.ts:4             | 16   | OK      |
| `sortMaintenanceRows`           | lib/reports/sortMaintenanceRows.ts:3           | 25   | OK      |
| `RawMaintenanceItem`            | lib/reports/toMaintenanceReportRow.ts:6        | 19   | OK      |
| `toMaintenanceReportRow`        | lib/reports/toMaintenanceReportRow.ts:25       | 25   | OK      |
| `ReportFilterParams`            | lib/reports/types.ts:1                         | 8    | OK      |
| `DepartmentComplianceItem`      | lib/reports/types.ts:9                         | 9    | OK      |
| `DepartmentCompactItem`         | lib/reports/types.ts:18                        | 5    | OK      |
| `CircularReportRow`             | lib/reports/types.ts:23                        | 16   | OK      |
| `CircularsReportSummaryData`    | lib/reports/types.ts:39                        | 11   | OK      |
| `MaintenanceReportRow`          | lib/reports/types.ts:50                        | 17   | OK      |
| `MaintenanceReportSummaryData`  | lib/reports/types.ts:67                        | 10   | OK      |
| `ReportDateMode`                | lib/reports/types.ts:77                        | 1    | OK      |
| `SortDirection`                 | lib/reports/types.ts:78                        | 2    | OK      |
| `ReportFilterState`             | lib/reports/types.ts:80                        | 10   | OK      |

### `lib/school` — 50 exports

| Function                          | File:line                                       | Body | Verdict      |
| --------------------------------- | ----------------------------------------------- | ---- | ------------ |
| `applyUserRoleUpdate`             | lib/school/applyUserRoleUpdate.ts:4             | 12   | OK           |
| `assertCanManageSchoolUsers`      | lib/school/assertCanManageSchoolUsers.ts:6      | 17   | OK           |
| `ManageUserPermissionResult`      | lib/school/assertCanManageUser.ts:6             | 16   | OK           |
| `assertCanManageUser`             | lib/school/assertCanManageUser.ts:22            | 42   | OK           |
| `assertDepartmentBelongsToSchool` | lib/school/assertDepartmentBelongsToSchool.ts:9 | 13   | OK           |
| `assertNotLastActiveSchoolAdmin`  | lib/school/assertNotLastActiveSchoolAdmin.ts:14 | 19   | OK           |
| `assignUserRole`                  | lib/school/assignUserRole.ts:3                  | 59   | FI-30        |
| `AboutCardItem`                   | lib/school/buildAboutCardList.ts:4              | 7    | OK           |
| `buildAboutCardList`              | lib/school/buildAboutCardList.ts:11             | 79   | OK           |
| `buildUserProfileUpdate`          | lib/school/buildUserProfileUpdate.ts:8          | 19   | FI-07        |
| `SchoolRow`                       | lib/school/getCurrentSchool.ts:3                | 24   | OK           |
| `getCurrentSchool`                | lib/school/getCurrentSchool.ts:27               | 37   | FI-18        |
| `getFirstActiveSchoolId`          | lib/school/getFirstActiveSchoolId.ts:13         | 13   | OK           |
| `PublicSchoolProfileRow`          | lib/school/getPublicSchoolProfile.ts:3          | 28   | OK           |
| `getPublicSchoolProfile`          | lib/school/getPublicSchoolProfile.ts:31         | 17   | OK           |
| `AuditLogRow`                     | lib/school/getSchoolAuditLogs.ts:3              | 10   | OK           |
| `getSchoolAuditLogs`              | lib/school/getSchoolAuditLogs.ts:13             | 20   | OK           |
| `DepartmentRow`                   | lib/school/getSchoolDepartments.ts:3            | 9    | OK           |
| `getSchoolDepartments`            | lib/school/getSchoolDepartments.ts:12           | 27   | OK           |
| `SchoolFullDetails`               | lib/school/getSchoolFullDetails.ts:5            | 5    | OK           |
| `getSchoolFullDetails`            | lib/school/getSchoolFullDetails.ts:10           | 32   | OK           |
| `LocationRow`                     | lib/school/getSchoolLocations.ts:3              | 11   | OK           |
| `getSchoolLocations`              | lib/school/getSchoolLocations.ts:14             | 28   | OK           |
| `getSchoolLogoUrl`                | lib/school/getSchoolLogoUrl.ts:1                | 7    | OK           |
| `SchoolUserRow`                   | lib/school/getSchoolUsers.ts:8                  | 10   | OK           |
| `getSchoolUsers`                  | lib/school/getSchoolUsers.ts:18                 | 29   | OK           |
| `isActiveSchoolMember`            | lib/school/isActiveSchoolMember.ts:10           | 17   | OK           |
| `isDepartmentInSchool`            | lib/school/isDepartmentInSchool.ts:12           | 18   | OK           |
| `mapDissociationError`            | lib/school/mapDissociationError.ts:18           | 21   | OK           |
| `RawProfileQueryResult`           | lib/school/mapSchoolUserRows.ts:3               | 14   | OK           |
| `MappedSchoolUser`                | lib/school/mapSchoolUserRows.ts:17              | 13   | OK           |
| `mapSchoolUserRows`               | lib/school/mapSchoolUserRows.ts:30              | 24   | OK           |
| `SchoolSettingsRow`               | lib/school/mergeSchoolSettings.ts:3             | 13   | OK           |
| `mergeSchoolSettings`             | lib/school/mergeSchoolSettings.ts:16            | 35   | OK           |
| `parseLocationInput`              | lib/school/parseLocationInput.ts:1              | 19   | OK           |
| `parseSchoolNameHierarchy`        | lib/school/parseSchoolNameHierarchy.ts:1        | 27   | OK           |
| `persistSchoolProfile`            | lib/school/persistSchoolProfile.ts:4            | 63   | OK           |
| `UpdateUserPersistInput`          | lib/school/persistUserUpdates.ts:6              | 28   | OK           |
| `persistUserUpdates`              | lib/school/persistUserUpdates.ts:34             | 61   | OK           |
| `prepareUserProfilePayload`       | lib/school/prepareUserProfilePayload.ts:1       | 16   | FI-22, FI-24 |
| `HeroSchoolData`                  | lib/school/resolveHeroSchoolData.ts:4           | 8    | OK           |
| `resolveHeroSchoolData`           | lib/school/resolveHeroSchoolData.ts:12          | 31   | OK           |
| `resolveLocalizedText`            | lib/school/resolveLocalizedText.ts:1            | 16   | OK           |
| `resolveSchoolName`               | lib/school/resolveSchoolName.ts:1               | 12   | OK           |
| `resolveUserRoleKey`              | lib/school/resolveUserRoleKey.ts:5              | 12   | OK           |
| `AuthUpdateAttrs`                 | lib/school/syncAuthUserUpdates.ts:3             | 6    | OK           |
| `syncAuthUserUpdates`             | lib/school/syncAuthUserUpdates.ts:9             | 32   | OK           |
| `toSchoolUserRow`                 | lib/school/toSchoolUserRow.ts:4                 | 22   | OK           |
| `uploadSchoolLogo`                | lib/school/uploadSchoolLogo.ts:7                | 39   | OK           |
| `validateUserUpdateInput`         | lib/school/validateUserUpdateInput.ts:1         | 17   | OK           |

### `lib/settings` — 4 exports

| Function                      | File:line                                      | Body | Verdict |
| ----------------------------- | ---------------------------------------------- | ---- | ------- |
| `SettingsAccessResult`        | lib/settings/assertCanAccessSettings.ts:5      | 7    | OK      |
| `assertCanAccessSettings`     | lib/settings/assertCanAccessSettings.ts:12     | 30   | OK      |
| `UserManagementAccess`        | lib/settings/resolveUserManagementAccess.ts:6  | 16   | OK      |
| `resolveUserManagementAccess` | lib/settings/resolveUserManagementAccess.ts:22 | 26   | OK      |

### `lib/storage` — 4 exports

| Function                | File:line                               | Body | Verdict |
| ----------------------- | --------------------------------------- | ---- | ------- |
| `hasValidFileSignature` | lib/storage/hasValidFileSignature.ts:21 | 9    | OK      |
| `UploadRules`           | lib/storage/validateStorageUpload.ts:3  | 8    | OK      |
| `UploadValidation`      | lib/storage/validateStorageUpload.ts:11 | 12   | FI-01   |
| `validateStorageUpload` | lib/storage/validateStorageUpload.ts:23 | 20   | FI-01   |

### `lib/supabase` — 6 exports

| Function                      | File:line                                     | Body | Verdict |
| ----------------------------- | --------------------------------------------- | ---- | ------- |
| `createSupabaseAdminClient`   | lib/supabase/createSupabaseAdminClient.ts:6   | 7    | OK      |
| `createSupabaseBrowserClient` | lib/supabase/createSupabaseBrowserClient.ts:6 | 5    | OK      |
| `createSupabaseServerClient`  | lib/supabase/createSupabaseServerClient.ts:7  | 19   | OK      |
| `SupabasePingResult`          | lib/supabase/pingSupabaseDatabase.ts:5        | 6    | OK      |
| `pingSupabaseDatabase`        | lib/supabase/pingSupabaseDatabase.ts:11       | 17   | OK      |
| `refreshSession`              | lib/supabase/refreshSession.ts:14             | 29   | OK      |

### `lib/validation` — 15 exports

| Function                         | File:line                                          | Body | Verdict |
| -------------------------------- | -------------------------------------------------- | ---- | ------- |
| `cleanFormField`                 | lib/validation/cleanFormField.ts:1                 | 8    | OK      |
| `loginSchema`                    | lib/validation/loginSchema.ts:3                    | 5    | OK      |
| `LoginInput`                     | lib/validation/loginSchema.ts:8                    | 2    | OK      |
| `parseAchievementFormData`       | lib/validation/parseAchievementFormData.ts:3       | 21   | FI-21   |
| `parseCalendarFormData`          | lib/validation/parseCalendarFormData.ts:4          | 26   | FI-21   |
| `parseCalendarRecurrenceInput`   | lib/validation/parseCalendarRecurrenceInput.ts:3   | 15   | OK      |
| `parseCircularFormData`          | lib/validation/parseCircularFormData.ts:3          | 20   | FI-21   |
| `parseLocationFormData`          | lib/validation/parseLocationFormData.ts:1          | 14   | OK      |
| `parseMaintenanceAssignData`     | lib/validation/parseMaintenanceAssignData.ts:3     | 14   | OK      |
| `parseMaintenanceFormData`       | lib/validation/parseMaintenanceFormData.ts:3       | 21   | FI-21   |
| `parseMaintenanceNoteData`       | lib/validation/parseMaintenanceNoteData.ts:1       | 12   | OK      |
| `parseMaintenanceTransitionData` | lib/validation/parseMaintenanceTransitionData.ts:3 | 17   | FI-21   |
| `parseSchoolFormData`            | lib/validation/parseSchoolFormData.ts:3            | 28   | OK      |
| `validateCircularResponse`       | lib/validation/validateCircularResponse.ts:1       | 5    | OK      |
| `validateDateRange`              | lib/validation/validateDateRange.ts:1              | 9    | OK      |

### `components/achievements` — 13 exports

| Function                    | File:line                                               | Body | Verdict |
| --------------------------- | ------------------------------------------------------- | ---- | ------- |
| `AchievementCard`           | components/achievements/AchievementCard.tsx:9           | 70   | OK      |
| `AchievementCategoryBadge`  | components/achievements/AchievementCategoryBadge.tsx:13 | 59   | FI-34   |
| `AchievementCategoryFields` | components/achievements/AchievementCategoryFields.tsx:9 | 61   | OK      |
| `AchievementDetailDialog`   | components/achievements/AchievementDetailDialog.tsx:15  | 76   | FI-33   |
| `AchievementDetailMetaGrid` | components/achievements/AchievementDetailMetaGrid.tsx:7 | 44   | OK      |
| `AchievementDetailView`     | components/achievements/AchievementDetailView.tsx:9     | 62   | OK      |
| `AchievementFilterBar`      | components/achievements/AchievementFilterBar.tsx:9      | 88   | OK      |
| `AchievementFormFields`     | components/achievements/AchievementFormFields.tsx:11    | 68   | OK      |
| `AchievementList`           | components/achievements/AchievementList.tsx:12          | 49   | OK      |
| `CreateAchievementDialog`   | components/achievements/CreateAchievementDialog.tsx:10  | 44   | OK      |
| `CreateAchievementForm`     | components/achievements/CreateAchievementForm.tsx:11    | 40   | FI-33   |
| `EditAchievementForm`       | components/achievements/EditAchievementForm.tsx:12      | 42   | FI-33   |
| `SchoolAchievementsHub`     | components/achievements/SchoolAchievementsHub.tsx:13    | 51   | OK      |

### `components/auth` — 6 exports

| Function             | File:line                                 | Body | Verdict |
| -------------------- | ----------------------------------------- | ---- | ------- |
| `AuthShell`          | components/auth/AuthShell.tsx:14          | 50   | OK      |
| `ClaimOwnerButton`   | components/auth/ClaimOwnerButton.tsx:8    | 31   | FI-24   |
| `ForgotPasswordForm` | components/auth/ForgotPasswordForm.tsx:10 | 59   | OK      |
| `LoginForm`          | components/auth/LoginForm.tsx:9           | 57   | OK      |
| `ResetPasswordForm`  | components/auth/ResetPasswordForm.tsx:10  | 71   | OK      |
| `SignOutButton`      | components/auth/SignOutButton.tsx:7       | 22   | FI-24   |

### `components/calendar` — 30 exports

| Function                        | File:line                                                | Body | Verdict |
| ------------------------------- | -------------------------------------------------------- | ---- | ------- |
| `CalendarActionButtons`         | components/calendar/CalendarActionButtons.tsx:14         | 75   | OK      |
| `CalendarCategoryFilterBar`     | components/calendar/CalendarCategoryFilterBar.tsx:10     | 32   | OK      |
| `CalendarCircularCard`          | components/calendar/CalendarCircularCard.tsx:17          | 72   | OK      |
| `CalendarCircularDetailContent` | components/calendar/CalendarCircularDetailContent.tsx:11 | 70   | OK      |
| `CalendarCoreFields`            | components/calendar/CalendarCoreFields.tsx:19            | 81   | OK      |
| `CalendarDateTimeFields`        | components/calendar/CalendarDateTimeFields.tsx:18        | 77   | OK      |
| `CalendarDayItemList`           | components/calendar/CalendarDayItemList.tsx:6            | 49   | FI-24   |
| `CalendarEventCard`             | components/calendar/CalendarEventCard.tsx:20             | 67   | OK      |
| `CalendarEventCardFooter`       | components/calendar/CalendarEventCardFooter.tsx:7        | 37   | OK      |
| `CalendarEventCategoryBadge`    | components/calendar/CalendarEventCategoryBadge.tsx:17    | 11   | OK      |
| `CalendarEventDetailCard`       | components/calendar/CalendarEventDetailCard.tsx:12       | 53   | OK      |
| `CalendarEventDetailContent`    | components/calendar/CalendarEventDetailContent.tsx:14    | 58   | OK      |
| `CalendarEventImageBanner`      | components/calendar/CalendarEventImageBanner.tsx:3       | 17   | OK      |
| `CalendarEventMetaFooter`       | components/calendar/CalendarEventMetaFooter.tsx:7        | 36   | FI-24   |
| `CalendarEventMetaGrid`         | components/calendar/CalendarEventMetaGrid.tsx:7          | 52   | OK      |
| `CalendarEventStatusBadge`      | components/calendar/CalendarEventStatusBadge.tsx:7       | 22   | OK      |
| `CalendarEventsView`            | components/calendar/CalendarEventsView.tsx:16            | 79   | OK      |
| `CalendarHub`                   | components/calendar/CalendarHub.tsx:12                   | 34   | OK      |
| `CalendarItemDetailDialog`      | components/calendar/CalendarItemDetailDialog.tsx:10      | 57   | OK      |
| `CalendarListView`              | components/calendar/CalendarListView.tsx:10              | 44   | OK      |
| `CalendarMonthDayCell`          | components/calendar/CalendarMonthDayCell.tsx:15          | 40   | OK      |
| `CalendarMonthGrid`             | components/calendar/CalendarMonthGrid.tsx:13             | 62   | OK      |
| `CalendarMonthSelectedPanel`    | components/calendar/CalendarMonthSelectedPanel.tsx:6     | 75   | OK      |
| `CalendarMonthView`             | components/calendar/CalendarMonthView.tsx:32             | 81   | OK      |
| `CalendarRecurrenceFields`      | components/calendar/CalendarRecurrenceFields.tsx:10      | 61   | OK      |
| `CalendarVisibilityBadge`       | components/calendar/CalendarVisibilityBadge.tsx:8        | 20   | OK      |
| `CalendarWeekendNotice`         | components/calendar/CalendarWeekendNotice.tsx:4          | 11   | OK      |
| `CreateCalendarEventForm`       | components/calendar/CreateCalendarEventForm.tsx:19       | 62   | OK      |
| `EditCalendarEventForm`         | components/calendar/EditCalendarEventForm.tsx:22         | 74   | OK      |
| `getCalendarDayCellStyles`      | components/calendar/getCalendarDayCellStyles.ts:1        | 24   | OK      |

### `components/circulars` — 43 exports

| Function                         | File:line                                                 | Body | Verdict |
| -------------------------------- | --------------------------------------------------------- | ---- | ------- |
| `AttachmentPreviewModal`         | components/circulars/AttachmentPreviewModal.tsx:10        | 78   | OK      |
| `CircularApprovalResponse`       | components/circulars/CircularApprovalResponse.tsx:7       | 41   | OK      |
| `CircularAttachmentActions`      | components/circulars/CircularAttachmentActions.tsx:9      | 80   | OK      |
| `CircularAttachmentEmbeddedView` | components/circulars/CircularAttachmentEmbeddedView.tsx:7 | 47   | OK      |
| `CircularAttachmentItem`         | components/circulars/CircularAttachmentItem.tsx:12        | 64   | OK      |
| `CircularAttachmentsList`        | components/circulars/CircularAttachmentsList.tsx:11       | 46   | OK      |
| `CircularDeleteDialog`           | components/circulars/CircularDeleteDialog.tsx:10          | 72   | OK      |
| `CircularDepartmentFilter`       | components/circulars/CircularDepartmentFilter.tsx:13      | 34   | OK      |
| `CircularDetailActions`          | components/circulars/CircularDetailActions.tsx:13         | 58   | OK      |
| `CircularDetailCard`             | components/circulars/CircularDetailCard.tsx:12            | 66   | OK      |
| `CircularDetailMetaGrid`         | components/circulars/CircularDetailMetaGrid.tsx:4         | 45   | OK      |
| `CircularDetailTargets`          | components/circulars/CircularDetailTargets.tsx:7          | 41   | OK      |
| `CircularFileUpload`             | components/circulars/CircularFileUpload.tsx:8             | 67   | OK      |
| `CircularFilterControls`         | components/circulars/CircularFilterControls.tsx:10        | 35   | OK      |
| `CircularFilters`                | components/circulars/CircularFilters.tsx:11               | 56   | OK      |
| `CircularList`                   | components/circulars/CircularList.tsx:12                  | 52   | OK      |
| `CircularMetaFields`             | components/circulars/CircularMetaFields.tsx:5             | 42   | OK      |
| `CircularPriorityBadge`          | components/circulars/CircularPriorityBadge.tsx:5          | 20   | OK      |
| `CircularPriorityFilter`         | components/circulars/CircularPriorityFilter.tsx:12        | 35   | OK      |
| `CircularPublishButton`          | components/circulars/CircularPublishButton.tsx:10         | 23   | OK      |
| `CircularRemindButton`           | components/circulars/CircularRemindButton.tsx:9           | 33   | OK      |
| `CircularRemindFooter`           | components/circulars/CircularRemindFooter.tsx:7           | 37   | OK      |
| `CircularRemindHeader`           | components/circulars/CircularRemindHeader.tsx:6           | 17   | OK      |
| `CircularRemindModal`            | components/circulars/CircularRemindModal.tsx:12           | 78   | OK      |
| `CircularRemindTargetSelector`   | components/circulars/CircularRemindTargetSelector.tsx:6   | 43   | OK      |
| `CircularResponseBanner`         | components/circulars/CircularResponseBanner.tsx:5         | 35   | OK      |
| `CircularResponseBox`            | components/circulars/CircularResponseBox.tsx:19           | 84   | OK      |
| `ResponseFilterTab`              | components/circulars/CircularResponseFilterBar.tsx:4      | 2    | OK      |
| `CircularResponseFilterBar`      | components/circulars/CircularResponseFilterBar.tsx:6      | 50   | OK      |
| `CircularResponseTable`          | components/circulars/CircularResponseTable.tsx:12         | 78   | OK      |
| `CircularResponseTableRow`       | components/circulars/CircularResponseTableRow.tsx:6       | 48   | OK      |
| `CircularRowActions`             | components/circulars/CircularRowActions.tsx:17            | 57   | OK      |
| `CircularSortSelect`             | components/circulars/CircularSortSelect.tsx:14            | 45   | OK      |
| `CircularStatusBadge`            | components/circulars/CircularStatusBadge.tsx:5            | 23   | OK      |
| `CircularStatusFilter`           | components/circulars/CircularStatusFilter.tsx:12          | 39   | OK      |
| `CircularTable`                  | components/circulars/CircularTable.tsx:6                  | 42   | OK      |
| `CircularTableRow`               | components/circulars/CircularTableRow.tsx:12              | 67   | OK      |
| `CircularTargetBadges`           | components/circulars/CircularTargetBadges.tsx:5           | 51   | OK      |
| `CreateCircularForm`             | components/circulars/CreateCircularForm.tsx:19            | 49   | OK      |
| `DepartmentTargetItem`           | components/circulars/DepartmentTargetItem.tsx:7           | 32   | OK      |
| `DepartmentTargetPicker`         | components/circulars/DepartmentTargetPicker.tsx:12        | 78   | OK      |
| `EditCircularFieldsGrid`         | components/circulars/EditCircularFieldsGrid.tsx:13        | 75   | OK      |
| `EditCircularForm`               | components/circulars/EditCircularForm.tsx:21              | 87   | OK      |

### `components/dashboard` — 13 exports

| Function                       | File:line                                               | Body | Verdict |
| ------------------------------ | ------------------------------------------------------- | ---- | ------- |
| `DashboardAchievementsWidget`  | components/dashboard/DashboardAchievementsWidget.tsx:12 | 58   | OK      |
| `DashboardComplianceDeptsCard` | components/dashboard/DashboardComplianceDeptsCard.tsx:6 | 66   | OK      |
| `DashboardComplianceDonut`     | components/dashboard/DashboardComplianceDonut.tsx:9     | 69   | OK      |
| `DashboardComplianceLegend`    | components/dashboard/DashboardComplianceLegend.tsx:5    | 37   | OK      |
| `DashboardComplianceWidget`    | components/dashboard/DashboardComplianceWidget.tsx:14   | 76   | OK      |
| `DashboardHeader`              | components/dashboard/DashboardHeader.tsx:7              | 13   | FI-24   |
| `DashboardQuickActions`        | components/dashboard/DashboardQuickActions.tsx:10       | 63   | OK      |
| `DashboardRecentCirculars`     | components/dashboard/DashboardRecentCirculars.tsx:12    | 48   | OK      |
| `DashboardRecentMaintenance`   | components/dashboard/DashboardRecentMaintenance.tsx:12  | 50   | OK      |
| `DashboardStatItem`            | components/dashboard/DashboardStatCard.tsx:14           | 9    | OK      |
| `DashboardStatCard`            | components/dashboard/DashboardStatCard.tsx:23           | 25   | OK      |
| `DashboardStatsGrid`           | components/dashboard/DashboardStatsGrid.tsx:7           | 70   | OK      |
| `DashboardVisionMission`       | components/dashboard/DashboardVisionMission.tsx:8       | 45   | OK      |

### `components/layout` — 15 exports

| Function                | File:line                                     | Body | Verdict |
| ----------------------- | --------------------------------------------- | ---- | ------- |
| `AppHeader`             | components/layout/AppHeader.tsx:12            | 41   | OK      |
| `AppHeaderGreeting`     | components/layout/AppHeaderGreeting.tsx:9     | 44   | OK      |
| `AppShell`              | components/layout/AppShell.tsx:6              | 44   | OK      |
| `AppSidebar`            | components/layout/AppSidebar.tsx:21           | 69   | OK      |
| `AppUserLabel`          | components/layout/AppUserLabel.tsx:8          | 24   | OK      |
| `AppUserMenu`           | components/layout/AppUserMenu.tsx:22          | 55   | OK      |
| `isNavLinkActive`       | components/layout/isNavLinkActive.ts:1        | 16   | OK      |
| `LanguageSwitcher`      | components/layout/LanguageSwitcher.tsx:7      | 26   | OK      |
| `MobileNav`             | components/layout/MobileNav.tsx:13            | 48   | OK      |
| `MobileNavDrawer`       | components/layout/MobileNavDrawer.tsx:10      | 85   | OK      |
| `MobileNavDrawerHeader` | components/layout/MobileNavDrawerHeader.tsx:9 | 43   | OK      |
| `MobileNavLinks`        | components/layout/MobileNavLinks.tsx:16       | 58   | OK      |
| `NavLink`               | components/layout/NavLink.tsx:9               | 54   | OK      |
| `SchoolLogoAvatar`      | components/layout/SchoolLogoAvatar.tsx:7      | 31   | OK      |
| `useIsMounted`          | components/layout/useIsMounted.ts:7           | 8    | OK      |

### `components/maintenance` — 20 exports

| Function                      | File:line                                                | Body | Verdict |
| ----------------------------- | -------------------------------------------------------- | ---- | ------- |
| `CreateMaintenanceForm`       | components/maintenance/CreateMaintenanceForm.tsx:19      | 69   | OK      |
| `LocationPicker`              | components/maintenance/LocationPicker.tsx:7              | 25   | OK      |
| `MaintenanceAddNoteBox`       | components/maintenance/MaintenanceAddNoteBox.tsx:12      | 42   | OK      |
| `MaintenanceAssignSection`    | components/maintenance/MaintenanceAssignSection.tsx:27   | 77   | OK      |
| `MaintenanceAttachmentsList`  | components/maintenance/MaintenanceAttachmentsList.tsx:9  | 62   | OK      |
| `MaintenanceCoreFields`       | components/maintenance/MaintenanceCoreFields.tsx:20      | 60   | OK      |
| `MaintenanceDetailCard`       | components/maintenance/MaintenanceDetailCard.tsx:11      | 58   | OK      |
| `MaintenanceDetailMetaGrid`   | components/maintenance/MaintenanceDetailMetaGrid.tsx:9   | 59   | OK      |
| `MaintenanceList`             | components/maintenance/MaintenanceList.tsx:15            | 82   | OK      |
| `MaintenanceListHeader`       | components/maintenance/MaintenanceListHeader.tsx:9       | 22   | OK      |
| `MaintenanceNoOperatorsAlert` | components/maintenance/MaintenanceNoOperatorsAlert.tsx:5 | 26   | OK      |
| `MaintenanceOperatorSelect`   | components/maintenance/MaintenanceOperatorSelect.tsx:13  | 33   | OK      |
| `MaintenancePriorityBadge`    | components/maintenance/MaintenancePriorityBadge.tsx:38   | 16   | OK      |
| `MaintenanceReasonForm`       | components/maintenance/MaintenanceReasonForm.tsx:9       | 60   | OK      |
| `MaintenanceStatusActions`    | components/maintenance/MaintenanceStatusActions.tsx:12   | 75   | OK      |
| `MaintenanceStatusBadge`      | components/maintenance/MaintenanceStatusBadge.tsx:52     | 11   | OK      |
| `MaintenanceStatusButtons`    | components/maintenance/MaintenanceStatusButtons.tsx:9    | 67   | OK      |
| `MaintenanceTableRow`         | components/maintenance/MaintenanceTableRow.tsx:13        | 44   | OK      |
| `MaintenanceTimeline`         | components/maintenance/MaintenanceTimeline.tsx:8         | 55   | OK      |
| `OperatorStatusButtons`       | components/maintenance/OperatorStatusButtons.tsx:8       | 59   | OK      |

### `components/notifications` — 6 exports

| Function                       | File:line                                                    | Body | Verdict |
| ------------------------------ | ------------------------------------------------------------ | ---- | ------- |
| `NotificationBadge`            | components/notifications/NotificationBadge.tsx:6             | 41   | OK      |
| `NotificationBell`             | components/notifications/NotificationBell.tsx:8              | 22   | OK      |
| `NotificationHeader`           | components/notifications/NotificationHeader.tsx:9            | 40   | OK      |
| `NotificationItem`             | components/notifications/NotificationItem.tsx:13             | 67   | OK      |
| `NotificationList`             | components/notifications/NotificationList.tsx:6              | 24   | OK      |
| `RealtimeNotificationListener` | components/notifications/RealtimeNotificationListener.tsx:11 | 48   | FI-28   |

### `components/public` — 15 exports

| Function                   | File:line                                         | Body | Verdict |
| -------------------------- | ------------------------------------------------- | ---- | ------- |
| `PublicAboutCard`          | components/public/PublicAboutCard.tsx:3           | 26   | OK      |
| `PublicAboutSection`       | components/public/PublicAboutSection.tsx:28       | 30   | FI-24   |
| `PublicEventCard`          | components/public/PublicEventCard.tsx:6           | 52   | OK      |
| `PublicEventsSection`      | components/public/PublicEventsSection.tsx:9       | 35   | OK      |
| `PublicFeaturesSection`    | components/public/PublicFeaturesSection.tsx:6     | 63   | FI-24   |
| `PublicFooter`             | components/public/PublicFooter.tsx:6              | 28   | OK      |
| `PublicFooterContact`      | components/public/PublicFooterContact.tsx:3       | 35   | FI-24   |
| `PublicHero`               | components/public/PublicHero.tsx:12               | 58   | OK      |
| `PublicHeroCapabilities`   | components/public/PublicHeroCapabilities.tsx:6    | 21   | OK      |
| `PublicHeroCardsGrid`      | components/public/PublicHeroCardsGrid.tsx:11      | 50   | OK      |
| `PublicHeroLeadershipCard` | components/public/PublicHeroLeadershipCard.tsx:13 | 44   | OK      |
| `PublicHeroLoginButton`    | components/public/PublicHeroLoginButton.tsx:8     | 18   | OK      |
| `PublicHeroSideCard`       | components/public/PublicHeroSideCard.tsx:10       | 23   | OK      |
| `PublicSectionTitle`       | components/public/PublicSectionTitle.tsx:31       | 12   | OK      |
| `PublicTopBar`             | components/public/PublicTopBar.tsx:13             | 45   | OK      |

### `components/pwa` — 7 exports

| Function                | File:line                                  | Body | Verdict |
| ----------------------- | ------------------------------------------ | ---- | ------- |
| `detectIosDevice`       | components/pwa/detectIosDevice.ts:4        | 15   | OK      |
| `IosInstallDialog`      | components/pwa/IosInstallDialog.tsx:8      | 71   | OK      |
| `IosInstallStepList`    | components/pwa/IosInstallStepList.tsx:6    | 46   | OK      |
| `isStandaloneMode`      | components/pwa/isStandaloneMode.ts:4       | 16   | OK      |
| `PwaInstallBanner`      | components/pwa/PwaInstallBanner.tsx:8      | 71   | OK      |
| `ServiceWorkerRegister` | components/pwa/ServiceWorkerRegister.tsx:5 | 21   | OK      |
| `usePwaInstall`         | components/pwa/usePwaInstall.ts:12         | 70   | OK      |

### `components/rbac` — 11 exports

| Function                   | File:line                                       | Body | Verdict |
| -------------------------- | ----------------------------------------------- | ---- | ------- |
| `CreateRoleDialog`         | components/rbac/CreateRoleDialog.tsx:7          | 19   | OK      |
| `CreateRoleForm`           | components/rbac/CreateRoleForm.tsx:12           | 81   | OK      |
| `EditRoleDialog`           | components/rbac/EditRoleDialog.tsx:15           | 86   | OK      |
| `PermissionCategoriesList` | components/rbac/PermissionCategoriesList.tsx:16 | 27   | OK      |
| `PermissionCheckboxGroup`  | components/rbac/PermissionCheckboxGroup.tsx:7   | 51   | OK      |
| `RoleBadge`                | components/rbac/RoleBadge.tsx:6                 | 18   | OK      |
| `RoleList`                 | components/rbac/RoleList.tsx:13                 | 60   | OK      |
| `RoleTableActions`         | components/rbac/RoleTableActions.tsx:13         | 55   | OK      |
| `RoleTableRow`             | components/rbac/RoleTableRow.tsx:11             | 41   | OK      |
| `UserRolesManager`         | components/rbac/UserRolesManager.tsx:11         | 41   | OK      |
| `UserRolesTabNav`          | components/rbac/UserRolesTabNav.tsx:7           | 41   | OK      |

### `components/reports` — 12 exports

| Function                      | File:line                                             | Body | Verdict |
| ----------------------------- | ----------------------------------------------------- | ---- | ------- |
| `CircularReportExpandedDepts` | components/reports/CircularReportExpandedDepts.tsx:62 | 27   | OK      |
| `CircularReportTableRow`      | components/reports/CircularReportTableRow.tsx:14      | 67   | OK      |
| `CircularsReportSummary`      | components/reports/CircularsReportSummary.tsx:6       | 24   | OK      |
| `CircularsReportTable`        | components/reports/CircularsReportTable.tsx:7         | 32   | OK      |
| `DepartmentComplianceTable`   | components/reports/DepartmentComplianceTable.tsx:14   | 51   | OK      |
| `ExportCsvButton`             | components/reports/ExportCsvButton.tsx:8              | 43   | OK      |
| `MaintenanceReportSummary`    | components/reports/MaintenanceReportSummary.tsx:6     | 35   | OK      |
| `MaintenanceReportTable`      | components/reports/MaintenanceReportTable.tsx:16      | 62   | OK      |
| `ReportDateFilterControls`    | components/reports/ReportDateFilterControls.tsx:8     | 64   | OK      |
| `ReportFiltersBar`            | components/reports/ReportFiltersBar.tsx:11            | 81   | OK      |
| `ReportKpiCard`               | components/reports/ReportKpiCard.tsx:9                | 35   | OK      |
| `ReportsHub`                  | components/reports/ReportsHub.tsx:31                  | 73   | OK      |

### `components/settings` — 56 exports

| Function                  | File:line                                               | Body | Verdict |
| ------------------------- | ------------------------------------------------------- | ---- | ------- |
| `AuditLogList`            | components/settings/AuditLogList.tsx:13                 | 52   | OK      |
| `BackupExportCard`        | components/settings/backup/BackupExportCard.tsx:11      | 79   | OK      |
| `BackupRestorePanel`      | components/settings/backup/BackupRestorePanel.tsx:8     | 18   | OK      |
| `ExportManifestSummary`   | components/settings/backup/ExportManifestSummary.tsx:11 | 20   | OK      |
| `BackupFileResult`        | components/settings/backup/parseBackupFile.ts:4         | 10   | OK      |
| `parseBackupFile`         | components/settings/backup/parseBackupFile.ts:14        | 16   | OK      |
| `RestoreConfirmDialog`    | components/settings/backup/RestoreConfirmDialog.tsx:10  | 75   | OK      |
| `RestoreConfirmHeader`    | components/settings/backup/RestoreConfirmHeader.tsx:7   | 43   | OK      |
| `RestoreDiffSummary`      | components/settings/backup/RestoreDiffSummary.tsx:12    | 56   | OK      |
| `RestoreMetadataSummary`  | components/settings/backup/RestoreMetadataSummary.tsx:6 | 54   | OK      |
| `RestoreUploadCard`       | components/settings/backup/RestoreUploadCard.tsx:8      | 60   | OK      |
| `useRestoreFile`          | components/settings/backup/useRestoreFile.ts:12         | 79   | OK      |
| `useRestorePreview`       | components/settings/backup/useRestorePreview.ts:14      | 30   | OK      |
| `SettingsTabItem`         | components/settings/buildSettingsTabs.ts:10             | 6    | OK      |
| `buildSettingsTabs`       | components/settings/buildSettingsTabs.ts:16             | 29   | OK      |
| `CreateDepartmentForm`    | components/settings/CreateDepartmentForm.tsx:13         | 42   | OK      |
| `CreateLocationForm`      | components/settings/CreateLocationForm.tsx:13           | 50   | OK      |
| `CreateUserBasicFields`   | components/settings/CreateUserBasicFields.tsx:7         | 60   | OK      |
| `CreateUserDeptSelect`    | components/settings/CreateUserDeptSelect.tsx:7          | 34   | OK      |
| `CreateUserDialog`        | components/settings/CreateUserDialog.tsx:9              | 29   | OK      |
| `CreateUserForm`          | components/settings/CreateUserForm.tsx:15               | 79   | OK      |
| `CreateUserPasswordInput` | components/settings/CreateUserPasswordInput.tsx:8       | 47   | OK      |
| `DepartmentList`          | components/settings/DepartmentList.tsx:10               | 55   | OK      |
| `DepartmentTableRow`      | components/settings/DepartmentTableRow.tsx:16           | 82   | OK      |
| `EditDepartmentDialog`    | components/settings/EditDepartmentDialog.tsx:13         | 72   | OK      |
| `EditLocationDialog`      | components/settings/EditLocationDialog.tsx:12           | 65   | OK      |
| `EditUserBasicFields`     | components/settings/EditUserBasicFields.tsx:7           | 74   | OK      |
| `EditUserDeptSelect`      | components/settings/EditUserDeptSelect.tsx:7            | 34   | OK      |
| `EditUserDialog`          | components/settings/EditUserDialog.tsx:9                | 28   | OK      |
| `EditUserForm`            | components/settings/EditUserForm.tsx:15                 | 81   | OK      |
| `EditUserSecurityFields`  | components/settings/EditUserSecurityFields.tsx:8        | 67   | OK      |
| `LocationFormFields`      | components/settings/LocationFormFields.tsx:7            | 75   | OK      |
| `LocationList`            | components/settings/LocationList.tsx:10                 | 57   | OK      |
| `LocationTableRow`        | components/settings/LocationTableRow.tsx:15             | 71   | OK      |
| `LocationTableRowActions` | components/settings/LocationTableRowActions.tsx:4       | 42   | OK      |
| `SchoolContactFields`     | components/settings/SchoolContactFields.tsx:6           | 60   | OK      |
| `SchoolIdentityFields`    | components/settings/SchoolIdentityFields.tsx:7          | 57   | OK      |
| `SchoolLeadershipFields`  | components/settings/SchoolLeadershipFields.tsx:6        | 72   | OK      |
| `SchoolLogoFields`        | components/settings/SchoolLogoFields.tsx:9              | 60   | OK      |
| `SchoolNarrativeFields`   | components/settings/SchoolNarrativeFields.tsx:5         | 66   | OK      |
| `SchoolOperationFields`   | components/settings/SchoolOperationFields.tsx:26        | 65   | OK      |
| `SchoolProfileForm`       | components/settings/SchoolProfileForm.tsx:15            | 47   | OK      |
| `SchoolProfilePanels`     | components/settings/SchoolProfilePanels.tsx:11          | 85   | OK      |
| `SchoolProfileSubTabs`    | components/settings/SchoolProfileSubTabs.tsx:7          | 43   | OK      |
| `SCHOOL_PROFILE_TABS`     | components/settings/schoolProfileTabList.ts:11          | 33   | OK      |
| `SchoolProfileTabId`      | components/settings/schoolProfileTabTypes.ts:3          | 3    | OK      |
| `SchoolProfileTabItem`    | components/settings/schoolProfileTabTypes.ts:6          | 6    | OK      |
| `SettingsNav`             | components/settings/SettingsNav.tsx:8                   | 48   | OK      |
| `useEditUserSubmit`       | components/settings/useEditUserSubmit.ts:6              | 19   | OK      |
| `UserFormFields`          | components/settings/UserFormFields.tsx:24               | 59   | FI-24   |
| `UserList`                | components/settings/UserList.tsx:24                     | 72   | OK      |
| `UserRoleSelect`          | components/settings/UserRoleSelect.tsx:8                | 46   | OK      |
| `UserStatusBadge`         | components/settings/UserStatusBadge.tsx:6               | 10   | OK      |
| `UserTable`               | components/settings/UserTable.tsx:8                     | 49   | OK      |
| `UserTableActions`        | components/settings/UserTableActions.tsx:12             | 77   | OK      |
| `UserTableRow`            | components/settings/UserTableRow.tsx:11                 | 53   | OK      |

### `components/theme` — 5 exports

| Function          | File:line                              | Body | Verdict |
| ----------------- | -------------------------------------- | ---- | ------- |
| `ThemeProvider`   | components/theme/theme-provider.tsx:18 | 4    | OK      |
| `ThemeToggle`     | components/theme/theme-toggle.tsx:17   | 61   | OK      |
| `PortalThemeItem` | components/theme/themeList.ts:1        | 8    | OK      |
| `PORTAL_THEMES`   | components/theme/themeList.ts:9        | 45   | OK      |
| `useMounted`      | components/theme/useMounted.ts:5       | 8    | OK      |

### `components/ui` — 25 exports

| Function            | File:line                               | Body | Verdict |
| ------------------- | --------------------------------------- | ---- | ------- |
| `AppMessageBox`     | components/ui/AppMessageBox.tsx:13      | 69   | OK      |
| `AUTH_INPUT`        | components/ui/auth-styles.ts:1          | 3    | OK      |
| `AUTH_BUTTON`       | components/ui/auth-styles.ts:4          | 3    | OK      |
| `CARD_SHELL_STATIC` | components/ui/diamond-card-styles.ts:8  | 3    | OK      |
| `CARD_SHELL`        | components/ui/diamond-card-styles.ts:11 | 2    | OK      |
| `CARD_HERO_PADDING` | components/ui/diamond-card-styles.ts:13 | 2    | OK      |
| `CARD_DIAMOND`      | components/ui/diamond-card-styles.ts:15 | 2    | OK      |
| `CARD_DIAMOND_ICON` | components/ui/diamond-card-styles.ts:17 | 2    | OK      |
| `CARD_RULE`         | components/ui/diamond-card-styles.ts:19 | 2    | OK      |
| `CARD_DIAMOND_SM`   | components/ui/diamond-card-styles.ts:21 | 2    | OK      |
| `CARD_FOOTER_BAR`   | components/ui/diamond-card-styles.ts:23 | 3    | OK      |
| `PANEL`             | components/ui/diamond-card-styles.ts:26 | 4    | OK      |
| `LIST_ROW`          | components/ui/diamond-card-styles.ts:30 | 2    | OK      |
| `GoldDots`          | components/ui/gold-dots.tsx:2           | 10   | OK      |
| `MessageBoxActions` | components/ui/MessageBoxActions.tsx:3   | 53   | OK      |
| `MessageBoxHost`    | components/ui/MessageBoxHost.tsx:7      | 8    | OK      |
| `MessageBoxIcon`    | components/ui/MessageBoxIcon.tsx:4      | 14   | OK      |
| `PageHeader`        | components/ui/page-header.tsx:8         | 39   | OK      |
| `SEGMENT_GROUP`     | components/ui/segment-styles.ts:9       | 3    | OK      |
| `segmentClass`      | components/ui/segment-styles.ts:12      | 7    | OK      |
| `chipClass`         | components/ui/segment-styles.ts:19      | 7    | OK      |
| `TABLE_WRAP`        | components/ui/table-styles.ts:2         | 3    | OK      |
| `TABLE_HEAD_ROW`    | components/ui/table-styles.ts:5         | 3    | OK      |
| `TABLE_BODY_ROW`    | components/ui/table-styles.ts:8         | 3    | OK      |
| `EMPTY_PANEL`       | components/ui/table-styles.ts:11        | 3    | OK      |

### `app` — 42 exports

| Function                  | File:line                                           | Body | Verdict      |
| ------------------------- | --------------------------------------------------- | ---- | ------------ |
| `AchievementsPage`        | app/[locale]/(app)/achievements/page.tsx:9          | 1    | FI-04        |
| `EditCalendarEventPage`   | app/[locale]/(app)/calendar/[id]/edit/page.tsx:12   | 1    | page         |
| `CalendarEventDetailPage` | app/[locale]/(app)/calendar/[id]/page.tsx:12        | 1    | page         |
| `NewCalendarEventPage`    | app/[locale]/(app)/calendar/new/page.tsx:8          | 1    | page         |
| `CalendarPage`            | app/[locale]/(app)/calendar/page.tsx:9              | 1    | page         |
| `EditCircularPage`        | app/[locale]/(app)/circulars/[id]/edit/page.tsx:11  | 1    | page         |
| `CircularDetailPage`      | app/[locale]/(app)/circulars/[id]/page.tsx:23       | 1    | page         |
| `NewCircularPage`         | app/[locale]/(app)/circulars/new/page.tsx:8         | 1    | page         |
| `CircularsPage`           | app/[locale]/(app)/circulars/page.tsx:13            | 1    | page         |
| `DashboardPage`           | app/[locale]/(app)/dashboard/page.tsx:22            | 1    | FI-04, FI-35 |
| `AuthenticatedAppLayout`  | app/[locale]/(app)/layout.tsx:14                    | 1    | page         |
| `MaintenanceDetailPage`   | app/[locale]/(app)/maintenance/[id]/page.tsx:19     | 1    | page         |
| `NewMaintenancePage`      | app/[locale]/(app)/maintenance/new/page.tsx:8       | 1    | page         |
| `MaintenancePage`         | app/[locale]/(app)/maintenance/page.tsx:8           | 1    | page         |
| `NotificationsPage`       | app/[locale]/(app)/notifications/page.tsx:8         | 1    | page         |
| `ReportsPage`             | app/[locale]/(app)/reports/page.tsx:10              | 1    | page         |
| `AuditSettingsPage`       | app/[locale]/(app)/settings/audit/page.tsx:8        | 1    | page         |
| `generateMetadata`        | app/[locale]/(app)/settings/backup/page.tsx:6       | 8    | page         |
| `BackupSettingsPage`      | app/[locale]/(app)/settings/backup/page.tsx:14      | 1    | page         |
| `DepartmentsSettingsPage` | app/[locale]/(app)/settings/departments/page.tsx:10 | 1    | page         |
| `SettingsLayout`          | app/[locale]/(app)/settings/layout.tsx:6            | 1    | page         |
| `LocationsSettingsPage`   | app/[locale]/(app)/settings/locations/page.tsx:10   | 1    | page         |
| `SettingsPage`            | app/[locale]/(app)/settings/page.tsx:4              | 1    | page         |
| `SchoolSettingsPage`      | app/[locale]/(app)/settings/school/page.tsx:9       | 1    | page         |
| `UsersSettingsPage`       | app/[locale]/(app)/settings/users/page.tsx:10       | 1    | page         |
| `ForgotPasswordPage`      | app/[locale]/(auth)/forgot-password/page.tsx:9      | 1    | page         |
| `LoginPage`               | app/[locale]/(auth)/login/page.tsx:9                | 1    | page         |
| `ResetPasswordPage`       | app/[locale]/(auth)/reset-password/page.tsx:7       | 1    | page         |
| `ErrorBoundary`           | app/[locale]/error.tsx:12                           | 1    | page         |
| `viewport`                | app/[locale]/layout.tsx:33                          | 10   | FI-29        |
| `generateMetadata`        | app/[locale]/layout.tsx:43                          | 28   | page         |
| `generateStaticParams`    | app/[locale]/layout.tsx:71                          | 4    | page         |
| `LocaleLayout`            | app/[locale]/layout.tsx:75                          | 1    | page         |
| `NotFoundPage`            | app/[locale]/not-found.tsx:9                        | 1    | page         |
| `HomePage`                | app/[locale]/page.tsx:9                             | 1    | page         |
| `GET`                     | app/api/auth/callback/route.ts:6                    | 23   | page         |
| `POST`                    | app/api/client-errors/route.ts:71                   | 2    | page         |
| `GET`                     | app/api/health/route.ts:35                          | 2    | page         |
| `GET`                     | app/api/keepalive/route.ts:23                       | 2    | page         |
| `GET`                     | app/api/reports/export/route.ts:52                  | 2    | page         |
| `GlobalError`             | app/global-error.tsx:11                             | 1    | page         |
| `RootNotFound`            | app/not-found.tsx:8                                 | 1    | page         |

### `root` — 4 exports

| Function         | File:line             | Body | Verdict |
| ---------------- | --------------------- | ---- | ------- |
| `routing`        | i18n/routing.ts:3     | 9    | OK      |
| `onRequestError` | instrumentation.ts:13 | 22   | OK      |
| `proxy`          | proxy.ts:8            | 1    | OK      |
| `config`         | proxy.ts:15           | 4    | OK      |

**Totals:** 786 unique exports · 668 clean · 39 framework entries · 79 carrying a finding reference.
