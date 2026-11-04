# Readiness report and implementation plan — 30 October 2026

**Repository:** `C:\Users\ahmed\Desktop\School_Administration_Portal`
**Branch:** `main` · **HEAD:** `f7bd2ed fix(circulars): update circular create, delete attachment, and remind actions`
**Working tree:** 157 modified + 21 untracked = **178 uncommitted entries**, no stash.
**Mode:** read-only inspection. No application file, migration, or configuration was changed. This report is the only file written.

---

## 0. Verdict

| Area                         | Verdict                                                                     |
| ---------------------------- | --------------------------------------------------------------------------- |
| Local gate suite             | **RED** — `typecheck` and `build` fail; `format:check` fails on 37 files    |
| `lint`                       | GREEN                                                                       |
| Unit tests                   | GREEN — 104 files / 331 tests                                               |
| Secret scan                  | GREEN                                                                       |
| File-size rule (≤ 300 lines) | GREEN — no `src/**/*.{ts,tsx}` exceeds 300 lines                            |
| i18n parity                  | GREEN — 711 = 711 keys                                                      |
| Migration `0048`             | **CANNOT BE APPLIED** — ambiguous function overload                         |
| Upload hardening (H-18)      | **INCOMPLETE** — validators exist, nothing calls them; failures are silent  |
| Database (local)             | At `0047`, empty; safe to reset                                             |
| Database (live)              | **UNKNOWN** — no access token; applied-migration state unverified           |
| Overall                      | **NO-GO.** Three blockers and two security regressions in uncommitted work. |

The redesign itself is sound: it is presentational, token-based, wired, and does not touch `src/actions/**` or `src/lib/**` apart from two files. The red state comes from one TypeScript error in the upload path, one ambiguous SQL overload, and formatting drift.

---

## 1. Method and evidence

Everything below was executed on the tree described above.

| #    | Command                                         | Result                                                                                          |
| ---- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| E-1  | `npm run lint`                                  | exit 0, no output                                                                               |
| E-2  | `npm run test`                                  | `Test Files 104 passed (104)` · `Tests 331 passed (331)`                                        |
| E-3  | `npm run typecheck`                             | exit 1 — `src/lib/maintenance/uploadMaintenancePhoto.ts(27,26): error TS2345`                   |
| E-4  | `npm run build`                                 | `✓ Compiled successfully in 8.8s` → `Failed to type check` (same error)                         |
| E-5  | `npx prettier --check .`                        | `Code style issues found in 37 files`                                                           |
| E-6  | `npm run scan:secrets`                          | `Secret scan passed.`                                                                           |
| E-7  | file-size scan over `src`                       | no file over 300 lines                                                                          |
| E-8  | i18n key diff (en/ar)                           | 711 / 711, zero missing either direction                                                        |
| E-9  | palette-class scan (`bg-blue-500`, …)           | 0 matches                                                                                       |
| E-10 | `white`/`black` literal scan                    | 0 matches                                                                                       |
| E-11 | `0048` applied inside a rolled-back transaction | `ERROR: function public.effective_permission_keys() is not unique`                              |
| E-12 | local `supabase_migrations.schema_migrations`   | newest = `0047`                                                                                 |
| E-13 | local row counts                                | 0 schools / 0 users / 0 circulars / 0 tickets / 0 storage objects                               |
| E-14 | `pg_policies` for `roles`, `file_metadata`      | current live definitions captured                                                               |
| E-15 | `pg_constraint` for `public.roles`              | `roles_pkey`, `roles_reserved_key_check`, `roles_school_id_fkey` — **no unique index on `key`** |
| E-16 | `git check-ignore`                              | `test-results/`, `playwright-report/`, `.next-e2e/` already ignored                             |

Reproduction commands are in Appendix A.

---

## 2. Findings

Severity: **Blocker** = tree cannot ship · **High** = security or correctness regression · **Medium** = latent defect or drift · **Low** = hygiene/polish.

### 2.1 Blockers

#### F-01 — `typecheck` and `build` fail (Blocker)

`src/lib/storage/validateStorageUpload.ts:11-13` declares:

```ts
export type UploadValidation =
  { bytes: Uint8Array; error?: never } | { bytes?: never; error: string };
```

TypeScript cannot narrow this union by testing `validation.error`, because `error` is optional on the first member. At `src/lib/maintenance/uploadMaintenancePhoto.ts:17` the guard passes, but at `:27` `validation.bytes` is still `Uint8Array | undefined`, which `storage.upload()` rejects:

```
error TS2345: Argument of type 'Uint8Array<ArrayBufferLike> | undefined' is not assignable to parameter of type 'FileBody'.
```

Confirmed in `npm run build`: compilation succeeds, then `Running TypeScript ... Failed to type check`. This is the only reason `npm run verify` cannot pass today.

**Fix:** give the union an explicit discriminant (`{ ok: true; bytes } | { ok: false; error }`) and update the three call sites. Full detail in WP-1.

---

#### F-02 — Migration `0048` creates an ambiguous `effective_permission_keys` override (Blocker)

`0013_effective_permissions.sql:2` defines `public.effective_permission_keys()` with **zero** arguments. `0048_security_hardening_m4_m5_m8_m9_m10_n11.sql:86` then adds:

```sql
create or replace function public.effective_permission_keys(p_school uuid default null)
```

Default arguments do not replace an existing zero-argument function; they create a second candidate. Executing `0048` inside a rolled-back transaction succeeds for every statement, and then:

```
ERROR:  function public.effective_permission_keys() is not unique
HINT:  Could not choose a best candidate function. You might need to add explicit type casts.
```

`src/lib/rbac/getEffectivePermissions.ts:5` calls `supabase.rpc("effective_permission_keys")` with no arguments. If `0048` were applied as written, **every permission load in the application would fail** — the whole authenticated UI depends on it.

**Fix:** `drop function public.effective_permission_keys();` immediately before the new definition, then re-grant. Detail in WP-3.

---

#### F-03 — `0048` re-opens a write primitive that migration `0036` deliberately closed (High, security regression)

`0036_production_audit_fixes.sql:118-122` documents the decision and replaces the policy with:

```sql
create policy file_metadata_insert on public.file_metadata
  for insert to authenticated
  with check (public.is_platform_owner());
```

`0048:40-48` replaces it with a member-writable policy:

```sql
with check (
  public.is_active_user()
  and public.is_school_member(school_id)
  and path like school_id::text || '/%'
  and (owner_id is null or owner_id = auth.uid())
)
```

`file_metadata` is **not read or written anywhere in `src`** — it only appears in `src/lib/backup/backupExclusions.ts:19`. So `0036`'s reasoning ("nothing in the application reads or writes it any more … removing the write primitive changes no behaviour") still holds, and `0048` undoes it for no functional gain. `path` remains globally unique and free-text, so this is the same squatting/oracle surface `0036` removed, merely narrowed to one's own school prefix.

**Fix:** delete section 2 of `0048`. If M8 must be closed at the policy level, the correct closure is to keep owner-only inserts and, separately, add a `check` that `path` starts with `school_id::text || '/'` so even the platform owner cannot write a foreign prefix.

---

#### F-04 — `format:check` fails on 37 files (High: gate hygiene)

`npx prettier --check .` lists 37 code files (plus the untracked `audit-report-2026-10-30.md`):

```
src/app/[locale]/(app)/circulars/[id]/edit/page.tsx
src/app/animations.css
src/components/auth/AuthShell.tsx
src/components/calendar/CalendarCircularCard.tsx
src/components/calendar/CalendarCoreFields.tsx
src/components/calendar/CalendarDateTimeFields.tsx
src/components/calendar/CalendarRecurrenceFields.tsx
src/components/circulars/CircularDetailCard.tsx
src/components/circulars/CircularMetaFields.tsx
src/components/circulars/CircularTableRow.tsx
src/components/circulars/CreateCircularForm.tsx
src/components/circulars/EditCircularForm.tsx
src/components/dashboard/DashboardAchievementsWidget.tsx
src/components/dashboard/DashboardQuickActions.tsx
src/components/dashboard/DashboardRecentCirculars.tsx
src/components/dashboard/DashboardRecentMaintenance.tsx
src/components/layout/AppUserMenu.tsx
src/components/maintenance/LocationPicker.tsx
src/components/maintenance/MaintenanceAddNoteBox.tsx
src/components/maintenance/MaintenanceAssignSection.tsx
src/components/maintenance/MaintenanceCoreFields.tsx
src/components/maintenance/MaintenanceList.tsx
src/components/maintenance/MaintenanceOperatorSelect.tsx
src/components/reports/CircularReportExpandedDepts.tsx
src/components/reports/DepartmentComplianceTable.tsx
src/components/reports/MaintenanceReportTable.tsx
src/components/reports/ReportDateFilterControls.tsx
src/components/reports/ReportFiltersBar.tsx
src/components/ui/card.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/input.tsx
src/components/ui/select.tsx
src/components/ui/table.tsx
src/components/ui/textarea.tsx
src/lib/storage/validateStorageUpload.ts
tailwind.config.js
```

35 of these are your redesign; `validateStorageUpload.ts` and `tailwind.config.js` are mine. Nothing here is a logic defect, but `npm run verify` starts with `format:check`, so it fails before it ever reaches the build.

**Decision needed:** running `prettier --write` rewrites your files. That is safe (formatting only) but touches 35 of them. WP-4 covers both options.

---

### 2.2 Upload hardening (H-18) — implemented but inert

#### F-05 — The pre-upload validators are never called (High)

These four files exist and are correct:

- `src/lib/maintenance/maintenancePhotoRules.ts`
- `src/lib/maintenance/assertValidMaintenancePhoto.ts`
- `src/lib/circulars/circularDocumentRules.ts`
- `src/lib/circulars/assertValidCircularDocuments.ts`

A repository-wide search finds **no call site** for `assertValidMaintenancePhoto` or `assertValidCircularDocuments` outside their own files. The stated purpose — "validates before the parent row is created so a rejected file cannot leave behind a ticket or circular missing its attachment" — is not in effect.

Consequence: `createMaintenanceAction` inserts the ticket, then uploads; if the upload is rejected, the ticket survives without its photo (`maintenance_requests` has no DELETE policy, so it cannot be rolled back).

#### F-06 — Both upload helpers discard the uploader's error (High)

`src/lib/maintenance/handleOptionalPhoto.ts:18-25` and `src/lib/circulars/handleCircularDocumentsUpload.ts:15-24` both:

```ts
): Promise<void> { … await uploadMaintenancePhoto(…) }
```

`uploadMaintenancePhoto` and `uploadCircularDocument` both return `Promise<{ error?: string }>`. The helpers await them and **drop the return value**, so a rejected or failed upload is indistinguishable from success.

All four call sites are affected and none inspect an error:

| Call site                                             | Line |
| ----------------------------------------------------- | ---- |
| `src/actions/maintenance/createMaintenanceAction.ts`  | 46   |
| `src/lib/maintenance/applyMaintenanceStatusChange.ts` | 22   |
| `src/actions/circulars/createCircularAction.ts`       | 60   |
| `src/actions/circulars/updateCircularAction.ts`       | 51   |

#### F-07 — The circular rules are duplicated in the uploader (Medium)

`src/lib/circulars/circularDocumentRules.ts` claims to be "kept in one place because both the uploader and the circular actions validate against them". The uploader does not use it: `src/lib/circulars/uploadCircularDocument.ts:5-6` still declares its own `ALLOWED_MIME` and `MAX_BYTES`, and repeats the three messages at `:22-36`.

`uploadMaintenancePhoto.ts` **does** use `maintenancePhotoRules` (this is the uncommitted rewrite), so the two buckets have already diverged in structure. Any future change to one rule set will silently miss the other.

---

### 2.3 Migration `0048` — remaining defects

#### F-08 — `effective_permission_keys(p_school)` has no caller (Medium, latent)

`src/lib/rbac/getEffectivePermissions.ts` is the only caller and passes no school. `src/lib/rbac/hasPermission.ts` calls `has_permission` (the boolean form), which `0048:14-37` does change. So M10's school-scoped _key list_ would land as unreachable API: more surface, no behaviour change, and its correctness untested.

Either wire it through `can()` / `assertPermission` (the real M10 fix) or drop the overload and record M10 as accepted-latent. Decision in §4.

#### F-09 — `roles.key` has no uniqueness constraint (Medium, security-adjacent)

Verified against the local schema (E-15): `public.roles` has only `roles_pkey`, `roles_reserved_key_check` (blocking `owner` and `platform_owner` for school-scoped rows) and the `school_id` FK. There is no unique index on `key`.

Combined with `circular_targets.role_key` (which has no FK — INSPECTION_REPORT N11), a school administrator can:

1. insert a custom role with `key = 'staff'` (only `owner`/`school_admin` are blocked by `0048:59`; `platform_owner` is blocked by `roles_reserved_key_check`),
2. grant it permissions,
3. receive every circular targeted at `role_key = 'staff'`.

This is role-label and targeting spoofing, not a permission escalation — but it makes `role_key` an untrustworthy identifier and it is why a `circular_targets_role_key_check` alone is insufficient. The seeded catalog is exactly the six keys that `0048:121` enumerates, so the check is correct today; the missing piece is uniqueness on `roles.key`.

#### F-10 — The operator-sync trigger never runs on deactivation (Medium)

`0048:126-147`:

```sql
if new.is_active then
  update public.maintenance_requests set assigned_operator_id = new.operator_id …
end if;
```

`saveMaintenanceAssignment` (`src/lib/maintenance/saveMaintenanceAssignment.ts:20-24`) deactivates the previous assignments before inserting the new one. On that deactivation the trigger does nothing, so `maintenance_requests.assigned_operator_id` keeps pointing at the previous operator until the app overwrites it a few statements later at `:30-40`.

Today the app always overwrites, so the stale state is transient. But the trigger is now a **second writer** of the same denormalised column, with different semantics from the app. If any future path deactivates an assignment without reassigning (a "revoke operator" action), the request will still claim an operator.

Two coherent options (decision in §4):

- **DB owns it:** trigger sets `assigned_operator_id = null` when `new.is_active` is false and the request currently points at `new.operator_id`; then drop `assigned_operator_id` from the app's payload.
- **App owns it:** drop the trigger; keep `saveMaintenanceAssignment` as the single writer.

#### F-11 — `notifications.payload` is added but unused (Low)

`0048:110-111` adds `payload jsonb not null default '{}'`. No code in `src` reads or writes it. Harmless and forward-looking, but it should be recorded as scaffolding, not as a closed finding, and the battery should assert the default.

---

### 2.4 Redesign artefacts

#### F-12 — `tailwind.config.js` is dead configuration (Low)

The file is untracked and referenced nowhere: no `@config` directive, no `tailwind.config` import. The project is Tailwind v4 CSS-first (`src/app/globals.css:1` = `@import "tailwindcss"`, theme declared with `@theme inline`). The file has no effect and would mislead the next person who edits it.

**Fix:** delete it.

#### F-13 — `themeColor` is hard-coded and ignores the selected theme (Low)

`src/app/[locale]/layout.tsx:37-40`:

```ts
themeColor: [
  { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  { media: "(prefers-color-scheme: dark)", color: "#09090b" },
],
```

The default theme is `moe` (`layout.tsx:96`), whose canvas is `#ffffff` and sidebar `#14254a`; `al-nada` is `#f4f7fc`, `emerald` `#f6fbf7`, `midnight` `#020617`. The browser chrome therefore matches light/dark but not the four other themes. This cannot be fully solved server-side (the theme is a client cookie/class), so the honest fix is either a single value tied to `moe`, or a small client effect that updates the meta tag on theme change.

#### F-14 — Tajawal is loaded with the `arabic` subset only (Low)

`layout.tsx:14-26` declares both font variables with `subsets: ["arabic"]`. The `en` locale falls back to a system font for Latin glyphs, so the two locales render in different typefaces. If the portal is Arabic-first this may be intentional — but it is currently undocumented and inconsistent with the bilingual UI.

---

### 2.5 Process, state, and drift

#### F-15 — The live database's migration state is unknown (Blocker for GO)

There is no `SUPABASE_ACCESS_TOKEN`, so `supabase migration list --linked` cannot run. The local stack is at `0047` (E-12); the live project's applied set is unverified. Every claim about production hardening (`0040`–`0047`) is therefore conditional.

#### F-16 — 178 uncommitted entries with no stash (Medium, operational risk)

All Phase 5 work is committed (`98210bc`), but the entire redesign, the upload rework, `0048`, and the report artefacts are working-tree only. There is no stash entry and no branch. A single `git checkout -- .` or `git clean -fd` destroys days of work. This is not a code defect, but it is the largest single risk in the repository right now.

#### F-17 — Documentation drift (Low)

- `docs/audits/2026-10-28-remediation-plan.md` has no Phase 5 status block, although Phases 0.2–4 have them.
- `docs/runbooks/backup_and_restore.md:63` says `npm run test:rls   # 119 authorization checks`. The battery's last full run reported **132** checks. The number is hard-coded prose and will drift again.

#### F-18 — `audit-report-2026-10-30.md` sits untracked at the repository root (Low)

A one-off audit artefact in the root directory is noise and will be picked up by ad-hoc tooling. It belongs in `docs/audits/` (with a date-stamped name) or should be deleted.

---

### 2.6 Verified as healthy (no action)

- **Redesign is presentational.** `src/actions/**` and `src/lib/**` are untouched apart from `src/lib/feedback/getMessageBoxTheme.ts` (tokenised warning/destructive classes — correct) and the uncommitted `uploadMaintenancePhoto.ts`.
- **New components are all wired:** `AuthShell` (3 auth pages), `GoldDots` (4 dashboard widgets), `PageHeader`, `PublicTopBar`, `PublicSectionTitle`, `CalendarEventCardFooter`, `CalendarMonthSelectedPanel`, `CircularDetailTargets`, `getCalendarDayCellStyles`, `isNavLinkActive`, `publicCardStyles`, `auth-styles`, `diamond-card-styles`, `segment-styles`, `table-styles`.
- **No hardcoded palette classes** and **no `white`/`black` literals** anywhere in `src` (E-9, E-10).
- **Dark-theme status tokens** are restored at `globals.css:306-310`.
- **File-size rule holds** — no `src` file exceeds 300 lines (E-7).
- **Playwright artefacts are already ignored** (E-16), so INSPECTION_REPORT M6 is closed.
- **Only `.env.example` is tracked**; `.env*` is ignored and the secret scan passes (E-6).

---

## 3. Implementation plan

Sequencing is deliberate: nothing touches the database until the tree compiles, because `npm run build` and the RLS harness both need a green typecheck.

### WP-1 — Restore a green tree (Blocker) · ~30 min

**Goal:** `npm run typecheck` and `npm run build` exit 0 without changing behaviour.

1. `src/lib/storage/validateStorageUpload.ts` — replace the union with a discriminated one:

   ```ts
   export type UploadValidation = { ok: true; bytes: Uint8Array } | { ok: false; error: string };
   ```

   and return `{ ok: false, error: … }` / `{ ok: true, bytes }`.

2. Update the three consumers to branch on `ok`:
   - `src/lib/maintenance/uploadMaintenancePhoto.ts:17-20`
   - `src/lib/maintenance/assertValidMaintenancePhoto.ts:16-19`
   - `src/lib/circulars/assertValidCircularDocuments.ts:16-19`

3. **Acceptance:** `npm run typecheck` → exit 0; `npm run build` → exit 0; `npm run test` → 331/331 (no test currently asserts the shape, so none should change).

**Rollback:** single-file revert; no data implications.

---

### WP-2 — Make the upload path fail loudly (High, closes H-18) · ~half a day

**Goal:** an invalid or failed attachment aborts the action instead of producing a parent row with no file.

1. Change both helpers to return the uploader's result:
   - `handleOptionalPhoto` → `Promise<{ error?: string }>`; return `{}` when there is no photo.
   - `handleCircularDocumentsUpload` → `Promise<{ error?: string }>`; stop at the first failing file and return its error (the uploader already deletes nothing, so a partial success must be reported, not swallowed).
2. Wire the pre-flight validators **before** the parent write:
   - `createMaintenanceAction`: `await assertValidMaintenancePhoto(photo)` before the ticket insert (currently `:46` runs after).
   - `createCircularAction` / `updateCircularAction`: `await assertValidCircularDocuments(formData)` before the circular insert/update.
   - `applyMaintenanceStatusChange`: `await assertValidMaintenancePhoto(evidencePhoto)` before the status update.
3. Propagate errors from the four call sites (return `{ error }` from the action, consistent with the existing action contract).
4. `src/lib/circulars/uploadCircularDocument.ts` — delete `ALLOWED_MIME` / `MAX_BYTES` / the three literals and use `circularDocumentRules` through `validateStorageUpload`, so there is exactly one rule set per bucket.
5. **Tests (new):**
   - each validator rejects wrong MIME, oversize, and signature mismatch;
   - `handleOptionalPhoto` returns the uploader's error;
   - `handleCircularDocumentsUpload` returns the first error and stops;
   - one action-level test proving a rejected photo leaves **no** `maintenance_requests` row.
6. **Acceptance:** the new tests pass; `handleOptionalPhoto` and `handleCircularDocumentsUpload` are no longer assignable to `Promise<void>` (compile-time proof that the error cannot be dropped).

**Risk:** `updateCircularAction` currently uploads after the update; moving validation earlier changes only the failure path, not the success path.

---

### WP-3 — Repair and re-scope `0048` (Blocker + High) · ~half a day

**Goal:** a migration that applies cleanly, does not regress `0036`, and is proven by the battery.

1. **Fix the overload (F-02).** Immediately before the new definition:

   ```sql
   drop function if exists public.effective_permission_keys();
   ```

   Then keep the `(uuid default null)` definition, the `revoke all … from public, anon` and the `grant execute … to authenticated, service_role`. Verified fix: after dropping the zero-arg form, `select public.effective_permission_keys()` resolves to the new function.

2. **Remove the `file_metadata` widening (F-03).** Delete section 2 entirely; `0036`'s owner-only policy stays in force. If M8 still needs a DB-level guarantee, add a `check (path like school_id::text || '/%')` to the existing owner-only policy instead of widening it.

3. **Resolve M10 (F-08)** — one of:
   - **(a) wire it:** add `schoolId` to `getEffectivePermissions(schoolId?)`, pass it from `can.ts` / `assertPermission.ts` call sites, and add a battery assertion that School A's keys are absent when asking for School B; or
   - **(b) drop it:** remove the overload from `0048`, keep the zero-arg function, and record M10 as accepted-latent in the remediation plan.

   (a) is the real fix; (b) is honest scope control. Both are defensible; see §4.

4. **Close the `roles.key` gap (F-09).** Add, in the same migration:

   ```sql
   create unique index if not exists roles_key_unique on public.roles (key);
   ```

   Precondition: verify no duplicate keys exist (the local catalog has six distinct keys; the live project must be checked before applying). If global uniqueness is not desired, the alternative is a partial unique index per school plus reserved keys — a product decision.

5. **Decide the trigger's owner (F-10)** — one of:
   - extend `sync_maintenance_request_operator` to handle `is_active = false` (clear `assigned_operator_id` when it points at this operator) and remove `assigned_operator_id` from `saveMaintenanceAssignment`'s payload; or
   - drop the trigger and keep `saveMaintenanceAssignment` as the only writer.

6. **Battery additions** (`supabase/tests/rls.battery.test.mjs`):
   - `effective_permission_keys()` (no args) returns rows — the ambiguity regression guard;
   - `effective_permission_keys(schoolB)` excludes a School-A-only permission (only if 3(a));
   - a plain member cannot insert into `file_metadata`;
   - `roles_insert` with `key = 'owner'` / `'school_admin'` is denied; duplicate key insert is denied;
   - deactivating an assignment clears `assigned_operator_id` (or the trigger is gone — assert the app path);
   - `circular_targets` with an unknown `role_key` is rejected.

7. **Verification sequence (local, empty database — safe):**

   ```bash
   supabase db reset          # expect 0001 → 0048, no errors
   npm run test:rls           # expect 132 + new checks, all green
   npm run test:e2e           # expect 8/8
   ```

   If Kong returns 502 on `/auth/v1/*` after the reset, restart `supabase_kong_school-administration-portal`, wait ~8 s, and confirm `/auth/v1/health` = 200.

8. **Acceptance:** reset completes; battery green including the new checks; `select public.effective_permission_keys();` succeeds; `\df public.effective_permission_keys` shows exactly one signature.

**Do not** run the destructive RLS battery against the live project.

---

### WP-4 — Formatting and hygiene (High → unblocks `verify`) · ~20 min

1. Decide the prettier scope (§4, Q1), then:
   - **Option A (recommended):** `npx prettier --write .` — 37 files, formatting only; review the diff for `src/components/ui/*` (largest churn) and commit it separately.
   - **Option B:** format only `src/lib/storage/validateStorageUpload.ts` and delete `tailwind.config.js`, leaving the 35 redesign files for you to format.
2. Delete `tailwind.config.js` (F-12).
3. Move or delete `audit-report-2026-10-30.md` (F-18).
4. **Acceptance:** `npm run format:check` exit 0; `git diff` for the formatting commit touches whitespace only (verify with `git diff -w --stat` — it should be empty).

---

### WP-5 — Docs and record-keeping (Low) · ~20 min

1. Add the Phase 5 status block to `docs/audits/2026-10-28-remediation-plan.md`, matching the format of the Phase 1–4 blocks: files added, battery total, gate results, and the date.
2. `docs/runbooks/backup_and_restore.md:63` — replace `119` with `132`, and add a note that the battery prints its own total, so the prose number is illustrative.
3. Record this report's findings against the plan (F-01…F-18) and mark `0036`'s `file_metadata` decision as _reaffirmed_.
4. **Acceptance:** the plan lists Phases 0–5 as complete; the runbook number matches the last battery run.

---

### WP-6 — Commit strategy (Medium, operational) · ~20 min

Split the 178 entries into reviewable commits, in this order:

1. `style: redesign pass` — the 157 presentational files + 15 new UI components (no logic).
2. `fix(storage): validate before write and surface upload errors` — WP-1 + WP-2.
3. `fix(db): repair 0048 overload and drop file_metadata widening` — WP-3 (migration + battery).
4. `docs: phase 5 status, runbook counts, readiness report` — WP-5.

Rationale: commit 1 is reviewable by eye and cannot break the build; commits 2–3 are the ones that need the gates. If commit 1 is formatted under Option A, it should be a separate `style: format` commit so its diff is provably whitespace-only.

---

### Out of scope for this batch

- Phase 6 (audit trail/observability), Phase 7 (medium correctness/UX/a11y), Phase 8 (test architecture).
- Live-database verification and the Phase 3 DR drill — both blocked on F-15 and the deployment target (D-8).
- Known residuals deliberately left: platform owners have no `school_id`, so `createUserAction`/`updateUserAction` fail for them; `filterRowsForManager` is dead code but still exported and tested.

---

## 4. Decisions required before implementation

| #   | Question                                                             | Options                                                                                               | Recommendation                                                |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Q1  | May `prettier --write` rewrite your 35 redesign files?               | A: yes, all 37 · B: only my two files                                                                 | **A**, as a whitespace-only commit                            |
| Q2  | M10: wire the school-scoped permission list, or record it as latent? | A: wire `getEffectivePermissions(schoolId)` through `can()`/`assertPermission` · B: drop the overload | **A** — it is the actual M10 fix and the battery can prove it |
| Q3  | Keep or drop the `file_metadata` insert widening?                    | A: drop (restore `0036`) · B: keep                                                                    | **A**                                                         |
| Q4  | Who owns `maintenance_requests.assigned_operator_id`?                | A: the trigger (and remove the app write) · B: the app (drop the trigger)                             | **A** — the DB is the security boundary                       |
| Q5  | Add `unique(roles.key)`?                                             | A: global unique · B: per-school unique + reserved list                                               | **A** (six distinct keys today)                               |
| Q6  | `audit-report-2026-10-30.md`: keep or delete?                        | A: move to `docs/audits/2026-10-30-redesign-audit.md` · B: delete                                     | **A**                                                         |
| Q7  | Deployment target (D-8) for live verification and the DR drill       | still open                                                                                            | needed before any GO claim                                    |

---

## 5. Definition of done for this batch

The batch is complete when **all** of the following are literally true:

1. `npm run verify` exits 0 (`format:check` → `lint` → `typecheck` → `test` → `scan:secrets` → `build`).
2. `supabase db reset` applies `0001`→`0048` with no error and no notice other than `already exists, skipping`.
3. `npm run test:rls` reports every check green, including the new `0048` regression checks, and its printed total is reflected in the runbook.
4. `npm run test:e2e` reports 8/8.
5. A rejected attachment leaves no `maintenance_requests` / `circulars` row (proven by a test, not by reasoning).
6. `select public.effective_permission_keys();` succeeds and `\df` shows one signature.
7. `git diff -w --stat` for the formatting commit is empty.
8. The Phase 5 status block exists in the remediation plan.

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

# 0048 ambiguity (rolled back, local only)
#   wrap the migration body in  begin; … select public.effective_permission_keys(); rollback;
docker exec -i supabase_db_school-administration-portal \
  psql -U postgres -d postgres -c "select proname, pg_get_function_identity_arguments(oid) from pg_proc where proname = 'effective_permission_keys';"

# schema facts
docker exec -i supabase_db_school-administration-portal psql -U postgres -d postgres -c \
  "select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.roles'::regclass;"
docker exec -i supabase_db_school-administration-portal psql -U postgres -d postgres -c \
  "select tablename, policyname, cmd, with_check from pg_policies where tablename in ('roles','file_metadata');"

# migration state
docker exec -i supabase_db_school-administration-portal psql -U postgres -d postgres -c \
  "select version, name from supabase_migrations.schema_migrations order by version desc limit 3;"

# i18n parity
node -e "const en=require('./src/messages/en.json'),ar=require('./src/messages/ar.json');const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'?f(v,p+k+'.'):[p+k]);const a=f(en),b=f(ar);console.log(a.length,b.length);"
```

## Appendix B — file inventory of the uncommitted work

| Group                             | Count | Notes                                                                                                                                                                                                                                                                                                      |
| --------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Redesign (modified)               | 157   | `src/app/**`, `src/components/**`, `src/app/globals.css`, `src/app/animations.css`, `src/messages/{en,ar}.json`, `src/lib/feedback/getMessageBoxTheme.ts`                                                                                                                                                  |
| New components/styles (untracked) | 15    | `AuthShell`, `CalendarEventCardFooter`, `CalendarMonthSelectedPanel`, `getCalendarDayCellStyles`, `CircularDetailTargets`, `isNavLinkActive`, `PublicSectionTitle`, `PublicTopBar`, `publicCardStyles`, `auth-styles`, `diamond-card-styles`, `gold-dots`, `page-header`, `segment-styles`, `table-styles` |
| Upload hardening (untracked)      | 4     | `assertValidMaintenancePhoto`, `maintenancePhotoRules`, `assertValidCircularDocuments`, `circularDocumentRules`; plus modified `uploadMaintenancePhoto.ts`                                                                                                                                                 |
| Database                          | 1     | `supabase/migrations/0048_security_hardening_m4_m5_m8_m9_m10_n11.sql`                                                                                                                                                                                                                                      |
| Artefacts                         | 2     | `tailwind.config.js` (dead), `audit-report-2026-10-30.md`                                                                                                                                                                                                                                                  |
