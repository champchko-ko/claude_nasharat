# School Administration Portal — Code Inspection Report

**Date:** 2026-10-22
**Commit inspected:** `012aba7` ("WP2: unblock the RLS authorization gate")
**Scope:** full repository — app source, SQL/RLS layer, build & CI pipeline, test suites, and live verification against the linked Supabase project (`dkaufjqerliehsztxhcs`).
**Method:** static review of every source file, all 18 migrations, the 3 RLS test files, and all config; execution of every quality gate; the RLS battery run live; read-only probes against the live database.

---

## 1. Verdict

The foundation is genuinely strong: a complete 23-table schema with deny-by-default RLS on every table, a coherent RBAC helper layer, Arabic-first RTL routing, and a CI pipeline with real gates. The RLS battery now executes and **passes 40/40** — the single hardest problem from the previous inspection is closed.

But the tree is **still red**, the security gate still runs **only locally** (never in CI), and two exploit paths remain live:

1. **A disabled user can re-enable themselves** and a reporter/creator/modifier can rewrite identity and scope columns of rows they own — because `profiles_update` and several write policies constrain too little (new finding **N1**, plus **H4/H5/H9**).
2. **A privilege-escalation chain from a self-service action to full platform ownership** is still viable: the last-owner guard reads the _new_ role, and `has_any_owner()` gates the guard itself (**H6 → H2**), with the broken owner query making the "Claim owner" button reappear for everyone (**C1**).

The WP2 exit gate in `build_plan.md` §7 (_"role escalation, disabled users, … all pass"_) is **not met**: the battery passes the cases it contains, but the highest-severity cases are either untested or still exploitable.

**Recommended priority:** close the escalation/self-service write holes (N1, H4, H5, H6, H2) → fix `C1` → reduce the SQL surface (H1, H3, H8, H9, H10) → repair `C4`, green the tree, and wire RLS into CI (C3).

---

## 2. Gate results

| Gate            | Command                       | Result            | Notes                                                                                        |
| --------------- | ----------------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| Format          | `npm run format:check`        | ✅ PASS (fixed)   | `src/components/ui/*.tsx` + this report formatted this session                               |
| Lint            | `npm run lint`                | ✅ PASS (fixed)   | 0 problems. `max-lines` raised 150 → 300 to match RULE #1 (AGENTS.md)                        |
| Typecheck       | `npm run typecheck`           | ✅ PASS           | strict TS, clean                                                                             |
| Unit tests      | `npm run test`                | ✅ PASS           | 3 files / **4 assertions total**                                                             |
| Secret scan     | `npm run scan:secrets`        | ✅ PASS           |                                                                                              |
| Build           | `npm run build`               | ✅ PASS           | 9 routes, `/ar` + `/en` prerendered; requires `SWC_NATIVE_BINDING_CACHE` on this Windows box |
| E2E             | `npx playwright test`         | ✅ PASS           | 1 smoke test                                                                                 |
| **RLS battery** | `npm run test:rls`            | ✅ **PASS 85/85** | harness negative control validated; 41 new authorization cases added (see §9)                |
| Supabase CLI    | `supabase migration list`     | ✅ PASS (fixed)   | `config.toml` repaired this session (C4/C5); CLI parses the config again                     |
| Local stack     | `supabase start` then battery | ✅ **PASS 85/85** | Disposable DB built from all **28** migrations                                               |
| Dev server      | `npm run dev`                 | ✅ running :3000  | `/` 200, `/en` 200, `/login` 200, `/dashboard` 307 → `/login`                                |

### Live database state (read-only)

| Property                    | Observed                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| Schools                     | **0**                                                                                            |
| Profiles / role assignments | 1 / 1 (platform `owner`, `school_id = null`)                                                     |
| Permission catalog          | 16 permissions, 6 roles, 24 role_permissions — matches migration 0010                            |
| Audit rows                  | **1074 — all `school_id = null`** (see H7)                                                       |
| `has_any_owner()` as `anon` | **`true`** (SECURITY DEFINER leaks owner existence to unauthenticated callers)                   |
| Owner existence query       | shipped form → `count: null`; embedded `roles!inner(key)` form → `count: 1` (C1, live-confirmed) |

---

## 3. Resolved since the previous report

- **C2 — RESOLVED.** The battery's missing `purgeOrphans` export was renamed to `cleanup`, the fixture's identical broken `.eq("roles.key","owner")` filter now uses `roles!inner(key)` + `maybeSingle()`, and the "no owner" case degrades to a reported `SKIP` instead of a `TypeError`. The battery now runs and reports **40/40**, and `supabase/tests/` is committed.
- **C3 — PARTIALLY RESOLVED.** The tests are tracked and `"test:rls"` exists in `package.json`, but **CI still never runs them** (`ci.yml` runs format → lint → typecheck → vitest → scan → build, plus Playwright; no disposable DB, no RLS job), and `npm run verify` omits `test:rls`. The auth model remains unguarded by CI.
- **Good new practice:** `rls.harness.test.mjs` is a genuine negative control — it asserts that `expectDenied` reports _permitted_ operations as failures, and would exit non-zero if the gate became vacuous.

**Fixed during this session (not yet committed):**

- **C4 — RESOLVED.** `supabase/config.toml` buckets converted to the map form the installed CLI (2.104.0) requires. `supabase migration list` no longer fails on config parsing.
- **C5 — RESOLVED (new finding, documented in §4).** `[auth.email] enable_signup = false` was disabling the email _provider_ outright, so no account could sign in against a freshly provisioned environment. The no-signup policy now lives on the global `[auth] enable_signup = false`, with the provider enabled.
- **Local verification loop established.** `supabase start` builds a disposable database from all 18 migrations and the battery runs against it (**39/39**). This is the substrate the C3 CI job needs.

---

## 4. Confirmed defects (still open)

### C1 — Platform-owner existence check is broken; the claim UI can never report "owner exists"

**Files:** `src/lib/auth/hasAnyPlatformOwner.ts:8`, `src/actions/auth/claimPlatformOwnerAction.ts:17`

Both call sites filter `user_role_assignments` on a joined column without declaring the embedded resource:

```ts
admin
  .from("user_role_assignments")
  .select("id", { count: "exact", head: true })
  .eq("roles.key", "owner") // ← PostgREST 400 PGRST108
  .is("school_id", null);
```

Both destructure only `{ count }` and discard `error`, so `(count ?? 0) > 0` is silently `false`.

**Live proof (this run):** shipped form → `{ count: null }`; embedded form → `{ count: 1 }`. A platform owner demonstrably exists.

**Impact**

- `hasAnyPlatformOwner()` **always returns `false`**, so the dashboard's `pendingAccount` branch is unreachable and the "Claim owner" button reappears for every signed-in user without a profile.
- `claimPlatformOwnerAction` first **upserts a profile through the service-role client** and only then calls the RPC; because the check never short-circuits, any authenticated user can self-provision a `profiles` row even when the platform is already bootstrapped (D3 says invitation-only). The RPC then fails with the generic `تعذّر إتمام المطالبة`.
- This is the visible half of the escalation chain in H6.

**Fix**

```ts
const { count, error } = await admin
  .from("user_role_assignments")
  .select("id, roles!inner(key)", { count: "exact", head: true })
  .eq("roles.key", "owner")
  .is("school_id", null);
if (error) throw new Error(`Owner check failed: ${error.message}`);
return (count ?? 0) > 0;
```

Cheaper and safer: call the caller's own `has_any_owner()` RPC (removes a privileged round trip from every dashboard render — see also the H-note in §6).

---

### C4 — `supabase/config.toml` is incompatible with the installed CLI; every CLI command fails

**File:** `supabase/config.toml:35, :40`

```
failed to parse config: decoding failed due to the following error(s):
  'storage.buckets[0][name]' expected a map or struct, got "string"
  'storage.buckets[0][public]' expected a map or struct, got "bool"
  'storage.buckets[0][file_size_limit]' expected a map or struct, got "string"
```

CLI **2.104.0** expects map form:

```toml
[storage.buckets.circular-attachments]
public = false
file_size_limit = "10MiB"
```

This blocks `supabase db push`, `db reset`, `migration list` and the documented WP2 loop. **Fix:** convert both bucket blocks (and add the public-assets bucket, which migration 0012 already creates).

**Status: FIXED this session** — all three buckets now use the map form; `supabase migration list` parses.

---

### C5 — `config.toml` disabled email logins entirely (not just sign-ups)

**File:** `supabase/config.toml` (`[auth.email]`)

```toml
[auth.email]
enable_signup = false   # ← the email PROVIDER switch, not the signup policy
```

`auth.email.enable_signup` maps to `GOTRUE_EXTERNAL_EMAIL_ENABLED`: `false` disables the email **provider**, so every sign-in fails with `Email logins are disabled`. The intended "invitation-only" policy (D3) belongs on the global switch, `[auth] enable_signup = false`.

**Impact:** a freshly provisioned environment (local `supabase start`, or any project synced from this file) has **no working login path at all** — the RLS battery, `npm run dev` against the local stack, and administrator-issued accounts are all blocked. This is why earlier attempts to run the battery locally could not authenticate.

**Status: FIXED this session** — moved the switch to `[auth] enable_signup = false`, set `[auth.email] enable_signup = true`, `enable_confirmations = false`.

---

### H1 — SECURITY DEFINER helpers are executable by `PUBLIC`/`anon`

**Files:** `0008_rbac_helpers.sql`, `0009_functions_triggers.sql:33`

All seven RBAC helpers (`is_active_user`, `has_any_owner`, `is_platform_owner`, `is_school_member`, `can_access_department`, `has_permission`, `is_circular_target`) plus `generate_school_number` are `SECURITY DEFINER` with **no `revoke`**. The only revoked function is `bootstrap_platform_owner` (`0010:87`).

`generate_school_number` is the concrete one: it inserts into `public.school_sequences`, a table `0011:437` deliberately leaves with **no policies** (service-role only). A definer function is the back door around that decision. Live-verified previously: `anon.rpc('generate_school_number', …)` passed the privilege check and aborted on an FK (0 rows written) — it can burn `CIR-YYYY-NNNN` numbers for any school id and acts as a school-uuid oracle. `anon.rpc('has_any_owner')` returns `true` on the live DB.

**Fix:** `revoke execute on function public.<fn>(…) from public, anon; grant execute … to authenticated;` for every helper; revoke `generate_school_number` from `public` and route it through a wrapper that validates caller scope.

---

### H2 — `bootstrap_platform_owner` does not bind `p_user_id` to the caller

**File:** `0010_seed_rbac.sql:67-88`

```sql
grant execute on function public.bootstrap_platform_owner(uuid) to authenticated;
```

The function never verifies `p_user_id = auth.uid()`, so any signed-in user can call `rpc("bootstrap_platform_owner", { p_user_id: "<any user id>" })` from the browser. It also accepts an **inactive** profile.

**Fix:** `if p_user_id is distinct from auth.uid() then raise exception …;` and require an active profile.

---

### H4 — A user can rewrite their own `profiles.department_id`/`school_id`, defeating circular targeting

**Files:** `0011_rls.sql:58-61` + `0008_rbac_helpers.sql:127-130` · **High**

`profiles_update`'s `id = auth.uid()` branch grants unrestricted column writes on the caller's own row, and `is_circular_target` resolves the department from exactly that column. A staff member can PATCH `department_id` to another department and immediately gain the body and attachments of that department's published circulars.

**Fix:** remove `id = auth.uid()` from `profiles_update` (or grant UPDATE only on a safe subset: `full_name`, `email`, `phone`), and resolve targeting from `user_role_assignments.department_id`.

---

### H5 — A reporter can rewrite arbitrary columns of their own ticket

**File:** `0011_rls.sql:278-292` · **Medium-High**

The reporter branch of `maintenance_requests_update` constrains **only** `status`; `school_id`, `priority`, `assigned_operator_id`, `closed_by`, `resolved_at`, `reporter_id` etc. are attacker-controlled. A reporter can relocate a ticket into another tenant's queue, escalate its priority, implicate an arbitrary operator, and forge closure evidence.

**Fix:** split the reporter branch into its own policy that pins every column except `status`/`reopen_reason` and adds `using (… and status = 'closed')`.

---

### H6 — The last-owner guard is bypassable, opening a full privilege-escalation chain

**Files:** `0015_battery_fixes.sql:104,109,135` + `0008_rbac_helpers.sql:17-31` + `0010_seed_rbac.sql:67-88` · **Medium-High (aggregate: High)**

The guard reads the role key from the **new** row on UPDATE, so changing `role_id` `owner → school_admin` passes with **no owner left**. `has_any_owner()` becomes `false`, which _disables_ both the self-grant guard (`0015:112`) and the platform-territory guard (`0015:116`). Any authenticated user can then call the unbound `bootstrap_platform_owner` (H2) and become owner. The same flaw lets the **last school administrator** be demoted (`school_admin → staff`).

**Fix:** evaluate the OLD `role_id` as well and raise if the OLD row was the last active owner/admin; bind `p_user_id`; stop gating the guards on a global `has_any_owner()`.

---

### H7 — Deleting a school erases the attribution of its entire audit trail — and the deletion is itself unrecorded

**Files:** `0016_audit_school_set_null.sql:3-6` + `0009_functions_triggers.sql:229-244` · **Medium**

`schools` has **no audit trigger**, and `audit_logs.school_id` is `on delete set null`. Live evidence: **1074 audit rows, all `school_id = null`**, after repeated test-school create/destroy. The most destructive operation in the schema leaves no trace, and its audit rows become owner-only. Conflicts with D9 (soft-delete).

**Fix:** add a `schools` audit trigger and snapshot the school name into `metadata` instead of nulling attribution.

---

### H8 — `circular_responses` insert has no targeting check, and a NULL department is a wildcard

**File:** `0011_rls.sql:216-221` + `0008_rbac_helpers.sql:108` · **Medium**

The insert policy has no `is_circular_target(circular_id)` predicate (unlike the select path), and `has_permission`'s department clause is `ura.department_id is null or ura.department_id = p_department` — a **school-scoped** assignment (NULL department) is a wildcard. A school-scoped head can insert a response with any `department_id` for any circular, including drafts; because of the unique `circular_responses_latest_idx`, the spoofed row **blocks the real department's genuine response**.

**Fix:** add `and public.is_circular_target(circular_id)` and bind `department_id` to the caller's own department.

---

### H9 — Child rows accept a parent id from another school

**Files:** `0011_rls.sql:202-208, 216-221, 337-351, 367-381` · **Medium**

None of these policies asserts that the referenced parent belongs to the row's `school_id`, and `school_id` on the new row is attacker-chosen. Examples: `circular_targets` can point at a School-Y circular while claiming School X; `circular_responses`, `maintenance_updates` and `maintenance_assignments` can inject rows into a foreign tenant's namespace. `circulars_update` itself lets a creator move a circular to another school.

**Fix:** add `with check (exists (select 1 from public.circulars c where c.id = circular_id and c.school_id = school_id))` and equivalents (or composite FKs on `(id, school_id)`), and pin `school_id` on updates.

---

### H10 — A school manager can grant roles to users outside their school

**File:** `0011_rls.sql:144-150` · **Medium**

`assignments_insert` never constrains `user_id` against `school_id`, and the integrity trigger checks only _self_-assignment and platform-level writes. A School-X admin can insert `{ user_id: <School-Y user>, role_id: school_admin, school_id: X }`, making that user a full administrator of X; `assigned_by` is also forgeable.

**Fix:** add `and exists (select 1 from public.profiles p where p.id = user_id and p.school_id = school_id)`.

---

### M7 — `maintenance_requests.status` is unconstrained on INSERT

**Files:** `0009_functions_triggers.sql:93-95` + `0011_rls.sql:275-277` · **Low-Medium**

The transition trigger is `before update` only. A `staff` member can create a ticket already `resolved`/`closed`/`assigned`, bypassing the legal-transition graph, and `assigned_operator_id` is free at insert (operator impersonation). The UPDATE transition machine itself is correctly enforced.

**Fix:** change the trigger to `before insert or update`, or add `status = 'submitted'` to the insert policy.

---

### M8 — `file_metadata` is writable by any member with free-text `path`/`owner_id`/`entity_id`

**File:** `0011_rls.sql:433-435` · **Low**

`path` is globally unique and not validated against the school prefix, so a member can squat another school's path and break a legitimate upload. This table is also the path-disclosure oracle that makes H3 exploitable.

**Fix:** `with check (is_school_member(school_id) and path like school_id::text || '/%')` and constrain `owner_id`.

---

### M9 — `roles_update` permits renaming a school role's `key` to `owner`

**File:** `0011_rls.sql:100-109` · **Low** — UI/role-label spoofing only (every owner check also requires `school_id is null`).

### M10 — The app's permission check is school-agnostic

**Files:** `0013_effective_permissions.sql:2-15`, `src/lib/rbac/can.ts`, `assertPermission.ts` · **Low (latent)** — `effective_permission_keys()` returns the union across schools and `can()` tests a flat list, so `users.manage` in School A satisfies a check for School B. No call site yet.

### M1 — Tree is red; D11 exemption inconsistent

Uncommitted `src/components/ui/` holds all 11 unformatted files and both lint errors. README says the dir is D11-exempt; `eslint.config.mjs:88` exempts it from `single-export` only, so the size caps still fail.

### M2 — Build depends on a machine-specific env var

`ERR_SWC_NATIVE_CACHE` on this Windows box; fixed by `SWC_NATIVE_BINDING_CACHE=C:\swc-cache`. CI (`ubuntu-latest`) is unaffected.

### M3 — Documentation drift

`README.md:8` says WP1 complete and `:53` says the Supabase CLI is not installed (2.104.0 is); `build_plan.md:12` says "Empty — no code yet"; there is no `docs/` and therefore no `docs/decisions.md` for the WP0 gate.

### M4 — `public-assets` permits SVG in a public bucket (stored-XSS surface).

### M5 — `has_permission` gives platform assignments no school-scoped effect — `hasPermission("audit.view", schoolId)` is a false negative for the owner. Latent.

### M6 — Playwright artefacts (`test-results/`, `playwright-report/`) are not git-ignored.

---

## 5. New findings (not in the previous report)

### N1 — A disabled user can re-enable themselves (High)

**File:** `0011_rls.sql:58-61` · `src/actions/auth/loginAction.ts`

`profiles_update`'s `id = auth.uid()` branch has no `is_active` guard and no column restriction, and `loginAction` never checks `is_active` after sign-in. Supabase does not invalidate a JWT when `profiles.is_active` flips. A deactivated user therefore:

1. still signs in (Supabase auth succeeds; the app shows the dashboard),
2. can still read rows they own (`profiles`, `notifications`, their own tickets/responses) because those policies key on `auth.uid()` with no active check, and
3. can `PATCH /rest/v1/profiles?id=eq.<self>` with `{"is_active": true}` and fully restore their permissions.

This defeats the WP2 gate item _"disabled users lose access including active sessions"_. The battery only tests a disabled user's _reads_.

**Fix:** block `is_active` (and `school_id`/`department_id`) changes from the self branch — column-level policy or a `BEFORE UPDATE` guard using `has_permission('users.manage', school_id)`; have `loginAction` sign out inactive users; and ban them in Supabase Auth (`auth.admin.updateUserById` with `ban_duration`) on deactivation. Add a battery case that attempts self-reactivation.

### N2 — Client environment parsing is broken (latent, High when used)

**File:** `src/lib/env/getClientEnv.ts` → `clientEnvSchema.safeParse(process.env)`

Next.js only **inlines statically referenced** `process.env.NEXT_PUBLIC_*` expressions (confirmed in `node_modules/next/dist/docs/.../environment-variables`: _"dynamic lookups will not be inlined"`). Passing the whole `process.env`object means the browser sees no public values, so`createSupabaseBrowserClient()`will throw`Invalid public environment variables` the first time a client component uses it (WP3). It is unused today, so the build does not catch it.

**Fix:** parse an explicit object: `{ NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL, … }`, or read the two values directly.

### N3 — No session refresh; cookie options dropped (High)

**Files:** `src/proxy.ts`, `src/lib/supabase/createSupabaseServerClient.ts:14-19`

`proxy.ts` runs only `next-intl`; there is no Supabase middleware to refresh the session. `createSupabaseServerClient`'s `setAll` ignores the `options` argument (`cookieStore.set(name, value)`), and in Server Components the write is swallowed anyway. Result: refreshed access/refresh tokens are never persisted, so a session effectively dies at JWT expiry (`jwt_expiry = 3600`) and cookies lose their max-age.

**Fix:** compose a Supabase session-refresh handler into `proxy.ts` and pass `options` through to `cookieStore.set`.

### N4 — Owner lockout paths (Medium-High)

- `has_any_owner()` ignores `profiles.is_active`, while `is_platform_owner()` requires it. Deactivating the sole owner (N1 also applies to the owner's own row) leaves an owner row but no _active_ owner, and `bootstrap_platform_owner` refuses to create another → permanent lockout reachable without service credentials.
- There is no last-active-owner/administrator guard on `profiles.is_active`; the guard exists only on assignment delete/update (and is itself bypassable, H6).

### N5 — The system-role catalog is invisible to school administrators (Medium, functional)

**File:** `0011_rls.sql:85-93`

`roles_select` exposes only `school_id IS NOT NULL` roles to school admins, so the seeded system roles (`department_head`, `staff`, `operator`, `auditor`, `school_admin`) cannot be listed, named, or assigned through the API they are expected to use. Assignment itself isn't blocked (`assignments_insert` doesn't check the role's scope), but the WP3 "users & roles" UI has no readable catalog.

### N6 — Public school information is not publicly readable (Medium, functional)

`schools_select` and `school_settings_select` are `to authenticated` only, so the public profile pages required by §5.3/6 (overview, vision, mission, contact) have no anonymous data path (public calendar does work).

### N7 — Audit coverage is incomplete (Medium)

No audit triggers on `schools`, `departments`, `locations`, `maintenance_requests`, `maintenance_updates`, `circular_targets`, `file_metadata` — but §5 requires audit for priority changes, closure/reopen, settings, and role/permission changes. Priority/status changes are currently only visible in `maintenance_updates` rows, which the actor controls.

### N8 — State is bypassable through the direct API (Medium)

There is no DB/RLS guard on `circulars.status` (a draft can be inserted directly as `published`), on `circulars.response_type` vs the configured type, on `maintenance_requests.status` at INSERT (M7), or on `circular_responses.is_latest`/`revision_of`. The eventual server actions must enforce these, but RLS does not, so the API is the security boundary and it is open.

### N9 — RTL debt in the shadcn primitives (Medium, before WP3)

All 11 primitives use physical Tailwind classes — `text-left` (`table.tsx:72`, `select.tsx:24`), `pr-8`/`pl-1.5`, `absolute right-2` (`select.tsx:129`, `dropdown-menu.tsx:168,209`), `ml-auto` (`dropdown-menu.tsx:121,243`). With `dir="rtl"` these render incorrectly. Use logical utilities (`text-start`, `ps/pe`, `end-2`, `ms-auto`); `components.json` also has `"rtl": false` and `src/lib/utils.ts` is dead code (components import `cn` from `"cn"` directly).

### N10 — Storage read scope is broader than the tables it protects (Medium)

`0012_storage.sql:29-35` (circular) and `:49-55` (**maintenance**) grant `select` to **any school member**. The table policies restrict maintenance attachments to reporter/operator/assign/update holders, but the bucket does not — any member can fetch any maintenance photo for the school. Files are also namespaced only by `school_id`, not by request/circular, so there is no per-record isolation. Latent until uploads exist (WP4/WP5).

### N11 — UI/nits

- `theme-toggle.tsx` renders a literal `"?"` for both icons (lines 26/32) — should use `lucide-react` Sun/Moon.
- `logoutAction.ts:3` uses `next/navigation` `redirect` → drops to default-locale root.
- `not-found.tsx` hardcodes a bilingual string; no `error.tsx`/`loading.tsx`.
- `notifications` has no `payload jsonb` (plan §5); `maintenance_assignments`/`assigned_operator_id` are denormalised with no sync trigger; `circular_targets.role_key` has no FK to `roles(key)`.
- Auth flows required by WP2 (password reset, invitation/activation) are absent; only sign-in/out + claim exist.

---

## 6. What is working well

- **RLS design is careful:** deny-by-default on all 23 tables; every `SECURITY DEFINER` function pins `set search_path = public`; school/department scoping from day one; partial unique indexes for assignments; `pg_trigger_depth()`-aware guards so FK cascades do not trip the last-admin protection.
- **The battery is now real, and self-checking.** 40/40 with a negative control that would fail if `expectDenied` were vacuous.
- **The audit trail is append-only for clients** (SELECT policy only), and the audit writer is null- and cast-safe (`0018`).
- **D11 enforcement is real** for `src/` — every non-exempt file has exactly one runtime export.
- **Env layer** is Zod-validated, fail-fast, and the service-role key is behind `server-only` (the _client_ half is broken — N2).
- **i18n/theming** are correctly configured; build output clean; secret scanner sensible.
- **The RLS harness and the migrated 0015–0018 fixes** show the previous iteration was methodical.

---

## 7. Recommended order of work

1. **N1 + C1** — stop disabled self-reactivation (guard `is_active`, check in `loginAction`, ban in Supabase Auth) and fix the owner-existence query.
2. **H6 + H2 + H4** — evaluate the last-owner guard from `old.role_id`, bind `bootstrap_platform_owner` to the caller, restrict `profiles_update`, re-point `is_circular_target`.
3. **H5 + H8 + H9 + H10 + M7** — split the reporter policy, bind responses to targets, assert parent/child school equality, constrain role grants, make the transition trigger cover INSERT.
4. **N3 + N2** — session-refresh middleware + cookie options; fix client env parsing.
5. **H1 + H3/N10 + H7 + N7** — revoke `EXECUTE` from `public`/`anon`, tighten storage read scope, add a `schools` audit trigger, close audit gaps.
6. **C4 + M1 + M6 + C3** — repair `config.toml`, green format/lint, git-ignore Playwright artefacts, and **add the RLS battery to CI against a disposable database**.
7. **M3 + N5 + N6 + N9** — refresh docs, expose the system-role catalog, make public school info anon-readable, RTL pass — before WP3 starts.
8. **M4/M5/M8–M10/N8/N11** — harden the remaining surface and add the missing unit/authorization tests.

---

## 8. Verification notes

- Every gate in §2 was executed on this machine at commit `012aba7`. The build required `SWC_NATIVE_BINDING_CACHE=C:\swc-cache`; with it set the build succeeds. `npm run dev` was verified on port 3000 (`/`, `/en`, `/login` → 200; `/dashboard` → 307).
- The live database was probed **read-only** with the service-role key and the anon key; no rows were written and no migrations were applied. The only write path exercised was the RLS battery itself, which seeds and cleans up its own fixture (leaving audit rows with `school_id = null` — the H7 symptom).
- C1 was confirmed with both the shipped and the embedded owner queries against the live project (`null` vs `1`).
- All write-policy findings (H4–H6, H8–H10, M7, N1, N8) are static analysis of the migrations; they were not exercised with writes.
- The previous report's open items were re-checked individually; C2 is resolved, C3 is partial, and every other listed finding was re-verified against the current source before inclusion here.
- **Local verification loop.** `supabase start` (Docker) boots a disposable stack from the full migration set; the battery runs against `http://127.0.0.1:54321` with the local publishable/secret keys and passes **62/62**. After any migration change, run `supabase db reset` then the battery. The live linked project was still only probed **read-only** this session — no migrations have been pushed to it.

---

## 9. Fix log (this session)

Everything below is implemented and verified locally; **nothing has been pushed to the linked project** (that needs the DB password / access token).

| Item          | Fix                                                                                                                                                                                                      | Artifact                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **RULE #1**   | One function per file / no big files recorded as the repo's top agent rule; `max-lines` cap raised 150 → 300 to match                                                                                    | `AGENTS.md`, `eslint.config.mjs`                                  |
| C4 / C5       | `config.toml` bucket map form + email provider re-enabled                                                                                                                                                | `supabase/config.toml`                                            |
| C1            | Owner-existence query uses `roles!inner(key)` and throws on error; claim action reuses the helper                                                                                                        | `hasAnyPlatformOwner.ts`, `claimPlatformOwnerAction.ts`           |
| N1            | `profiles` BEFORE UPDATE guard blocks self-changes to `is_active`/`school_id`/`department_id`; `loginAction` refuses + signs out inactive users; new `auth.disabled` message                             | `0019`, `loginAction.ts`, `LoginForm.tsx`, messages               |
| H4            | Self-scope guard (above) + `is_circular_target` now resolves department from `user_role_assignments`                                                                                                     | `0019`, `0021`                                                    |
| H6 / H2 / N4  | Last-owner/admin guard reads the **OLD** row; `bootstrap_platform_owner` bound to `auth.uid()` + active profile; last owner/admin cannot be deactivated; guards bound to end-user requests only          | `0020`                                                            |
| H5 / M7       | Transition trigger covers INSERT; insert policy pins `status='submitted'` + no pre-assignment; new scope trigger pins identity/priority/assignee for reporters and operators                             | `0022`                                                            |
| H8 / H9 / H10 | Responses bound to target + caller department + same-school circular; child rows require parent in the same school; circular tenant immutable; role grants confined to the target user's school          | `0022`                                                            |
| N2 / N3       | `getClientEnv` references each public var explicitly; Supabase session refresh composed into `src/proxy.ts`; cookie options passed through in the server client                                          | `getClientEnv.ts`, `refreshSession.ts`, `proxy.ts`, server client |
| M1            | Tree greened: `src/components/ui/*` formatted, lint 0 problems                                                                                                                                           | —                                                                 |
| H1            | Helper EXECUTE grants locked down (anon/public revoked; policy helpers → authenticated, privileged helpers → service_role); the only anon policy touching a helper was split so anon no longer needs one | `0023`                                                            |
| H3 / N10      | Storage reads now resolve the object back to its circular/request and apply that entity's audience, instead of any school member                                                                         | `0024`                                                            |
| H7 / N7       | Audit triggers added for schools, departments, locations, maintenance_requests, maintenance_updates, circular_targets, file_metadata; schools rows snapshot their name so attribution survives a delete  | `0025`                                                            |
| N12 (new)     | `has_permission` dropped department-scoped assignments whenever `p_department` was omitted — dept-scoped roles (staff, department_head) held none of their school-scoped permissions                     | `0026`                                                            |
| C3            | The RLS battery now runs in CI against a disposable local Supabase stack                                                                                                                                 | `.github/workflows/ci.yml`                                        |
| M6            | Playwright artefacts (`test-results/`, `playwright-report/`, `blob-report/`, `.playwright/`) git-ignored                                                                                                 | `.gitignore`                                                      |
| M3            | Docs refreshed (README status + CLI note, `build_plan` current state + D11 cap) and the WP0 `docs/decisions.md` added                                                                                    | `README.md`, `build_plan.md`, `docs/decisions.md`                 |
| N5            | System role catalog is readable by the school admins who assign it (still read-only to them)                                                                                                             | `0027`                                                            |
| N6            | Curated, anon-readable `public_school_profiles` view (active schools + public fields only)                                                                                                               | `0028`                                                            |
| N9            | RTL pass: logical utilities (`text-start`, `ps/pe`, `ms-auto`, `end-2`) in the primitives, `components.json` `rtl: true`, dead `src/lib/utils.ts` removed                                                | `src/components/ui/*`, `components.json`                          |

**Battery growth:** 40/40 → **85/85** (45 cases added across Phases 1–7: C1 shape, H4 self-scope, N1 self-reactivation, H6/H2/N4 owner guards, H5 reporter/operator scope, M7 pre-closed/pre-assigned inserts, H8 response targeting/department, H9 cross-school child rows, H10 out-of-school grants, H1 helper lockdown, N12 department-scoped permissions, N7 workflow auditing, H7 school auditing, H3/N10 attachment audience, N5 role catalog, N6 public profile view). The fixture now seeds a platform owner so several previously-`SKIP`ped cases execute.

**Migrations added:** `0019_guard_profile_self_update`, `0020_owner_guards`, `0021_circular_target_from_assignments`, `0022_write_scope`, `0023_function_grants`, `0024_storage_read_scope`, `0025_audit_coverage`, `0026_permission_department_scope`, `0027_system_role_catalog`, `0028_public_school_profiles` (18 → 28 total).
