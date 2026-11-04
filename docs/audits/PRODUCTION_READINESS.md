# Production Readiness Review

**Date:** 2026-11-01
**Scope:** the whole application, after the compliance/chart work (`COMPLIANCE_CHART_AUDIT.md`).
**Question:** is this app safe to call production-ready?

---

## Verdict

**Not yet — but nothing found points at a code defect.** Three gates are open, all of them configuration or process:

1. The production database is **four migrations behind** (0059–0062).
2. **CI is red** on `format:check` (97 files, all pre-existing).
3. The site is **behind the under-construction gate** on Vercel unless one env var is set.

Everything I could exercise locally — build, types, lint, unit tests, the RLS battery, secrets, dependencies, headers, RLS coverage, auth guards — is clean. The gap between "works" and "ready" here is deployment state, not implementation.

---

## Blockers

### B1. Production schema is four migrations behind

`0059`–`0062` exist only in this working tree and the local stack. Until they are pushed, production keeps its hand-edited role rows, and a fresh install would behave differently from production — exactly the drift the audit flagged.

**Fix**

```powershell
supabase db dump --linked -f supabase/.temp/prod-before-push.sql   # rollback point
supabase db push                                                    # needs DB password / access token
```

`0061` is the only change a user will notice: school administrators lose the ability to create/edit roles. Owner grants (`0060`) and owner membership (`0062`) only widen what the owner sees.

### B2. CI cannot go green

`.github/workflows/ci.yml` runs `format:check` before lint/typecheck/test/build. It currently fails on **97 files** — `src/lib/circulars/*`, root Markdown (`README.md`, `AGENTS.md`, …), and others. None of them are files this work touched; the repo has never been fully formatted with the current `.prettierrc` (printWidth 100 + the Tailwind class-sorting plugin).

Until that job is green, the pipeline gates nothing, so "tests pass" means "tests passed on my machine".

**Fix (mechanical, reviewable)**

```powershell
npm run format        # prettier --write .
git diff --stat       # formatting only; no logic changes
```

Alternative if the current style is preferred: relax the gate (`prettier --check` on changed files only). Either way, decide before relying on CI.

### B3. The under-construction gate is ON by default on Vercel

`src/lib/env/isUnderConstruction.ts:12-14` returns `false` when `VERCEL !== "1"`, then `false` if `DISABLE_UNDER_CONSTRUCTION === "true"`, and otherwise **`true`**. So every Vercel deployment serves the holding page until that variable is set (the bypass cookie only admits people who know `UNDER_CONSTRUCTION_BYPASS_SECRET`).

This is deliberate design, but it means "deployed" and "launched" are two different switches.

**Fix:** set `DISABLE_UNDER_CONSTRUCTION=true` in the production environment when you intend the portal to be public, and keep the bypass secret for previews.

---

## Verified here (commands run in this session)

| Area                   | Evidence                                                                                       | Result                                                                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build                  | `npm run build`                                                                                | **PASSED** — compiled, 54 routes generated                                                                                                                                      |
| Types                  | `npx tsc --noEmit`                                                                             | **PASSED** — exit 0                                                                                                                                                             |
| Lint                   | `npx eslint .`                                                                                 | **PASSED** — exit 0 (300-line, 80-line-function, complexity, single-export gates active)                                                                                        |
| Unit/component tests   | `npx vitest run`                                                                               | **PASSED** — 697 tests                                                                                                                                                          |
| Database authorization | `npm run test:rls` on a clean reset                                                            | **PASSED** — 152/152 checks. The runner now refuses a database that already has a platform owner: a seeded DB fails ~15 owner-scoped checks because 0020 allows only one owner. |
| Secrets in tree        | `npm run scan:secrets`                                                                         | **PASSED**                                                                                                                                                                      |
| Service-role isolation | grep: no `"use client"` file imports `createSupabaseAdminClient` / `SUPABASE_SERVICE_ROLE_KEY` | **PASSED**                                                                                                                                                                      |
| Dependency CVEs        | `npm audit --omit=dev`                                                                         | **0 vulnerabilities**                                                                                                                                                           |
| RLS coverage           | catalog query on the local DB                                                                  | **PASSED** — all 25 public tables have RLS enabled and policies                                                                                                                 |
| Security headers       | `next.config.mjs` + `buildContentSecurityPolicy.ts`                                            | HSTS, XFO `DENY`, `nosniff`, Referrer-Policy, Permissions-Policy, nonce CSP with `strict-dynamic`, no `unsafe-eval` outside dev, API CSP `default-src 'none'`                   |
| Auth session hygiene   | `src/proxy.ts` + `refreshSession.ts`                                                           | rotated tokens written to the response; locale first, then refresh                                                                                                              |
| Owner claim            | `claimPlatformOwnerAction`                                                                     | refuses once an owner exists (`hasAnyOwner`)                                                                                                                                    |
| Health/ops             | `/api/health`                                                                                  | liveness without DB; `?deep=1` requires `HEALTH_CHECK_SECRET`/`CRON_SECRET` or owner session; Vercel cron keepalive every 3 days                                                |
| Compliance rework      | `calculateCompliance` §4.2 scenario; live dashboard and reports                                | **PASSED** — one calculation, identical numbers on both surfaces (17% = 1 of 6 on the seeded demo)                                                                              |
| Error handling         | `[locale]/error.tsx`, `global-error.tsx`                                                       | client errors reported with a stable correlation id shown to the user                                                                                                           |
| Dead code / debug      | grep for `TODO                                                                                 | FIXME                                                                                                                                                                           | XXX | HACK`, empty `catch {}`, `console.log` | one benign PWA registration log; no empty catches |
| Backups                | `0042_restore_backup_transactional.sql`, `backup_snapshots`                                    | restore RPC + pre-restore snapshot exist                                                                                                                                        |

---

## Known limitations — accept deliberately

1. **Login rate limiting is per-instance memory** (`consumeRateLimitToken.ts` says so explicitly). It stops a broken client, not a distributed brute force; GoTrue's own limits are the real control. Fine for a single-school portal, not for a public API.
2. **No alerting by default.** Errors are structured logs with correlation ids; a collector is only used when `ERROR_REPORTING_URL` is set. Set it if you want to be paged.
3. **No scheduled database backup in the repo.** Settings → Backup is manual; Supabase's plan-level backups are outside this codebase. Confirm the plan, or schedule `supabase db dump`.
4. **Dashboard compliance loads every circular** of the school (linear now). Trivial at 5, noticeable at thousands — the aggregate RPC in `COMPLIANCE_CHART_AUDIT.md` §9 is the upgrade path.
5. **The selector shows the 10 newest circulars** with targets and now says so; older ones live in Reports.

---

## Not verified — needs an environment I don't have

- **End-to-end suite** (`.github/workflows/ci.yml` job 2): Playwright + a built app. Not run here.
- **The hosted project's environment variables** — I can read its data and permissions, not the Vercel dashboard. B3 and the required secrets are therefore "confirm", not "verified".
- **Dark mode and an Arabic screen-reader pass.**
- **Load/resilience**: no concurrency or failover test was performed.

---

## Launch checklist (in order)

1. `npm run format` → CI green; commit the formatting separately.
2. Review and commit the feature work (see the commit split in the handover).
3. `supabase db dump` the production project; then `supabase db push`.
4. Confirm production env: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL`, `SCHOOL_TIMEZONE`, `CRON_SECRET`, `HEALTH_CHECK_SECRET`, and `DISABLE_UNDER_CONSTRUCTION=true` when going public.
5. Smoke test as owner: sign in → dashboard 4% (1 of 23) → reports agree → audit page loads.
6. Smoke test as school admin: dashboard visible, role editing refused, users manageable.
7. Watch the first hour of logs for `[supabase] could not write auth cookies` and error references.
