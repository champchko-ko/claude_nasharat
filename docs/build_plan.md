# School Administration Portal — Actionable Build Plan

**Companion to:** `school_administration_implementation_plan.md` (requirements & architecture — the source of truth for _what_ to build).
**Purpose of this document:** the ordered, executable plan for _how_ to build it in this repository — locked assumptions, repo layout, data model, permission matrix, work packages with test gates, timeline, CI/CD, and Sprint 0.

---

## 1. Current state

| Item            | Status                                                                                                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository      | **Active.** Next.js 16 app (App Router, strict TS, Tailwind 4, `next-intl` ar/en), 26 Supabase migrations, 81-check RLS battery, unit + e2e tests, CI. See `INSPECTION_REPORT.md` for the current audit state. |
| Requirements    | Complete (companion doc §1–§13, incl. test strategy and Definition of Done).                                                                                                                                   |
| Stack decision  | Next.js + TypeScript + Tailwind on Vercel; Supabase (PostgreSQL, Auth, Storage, RLS). Confirmed per companion doc §2.                                                                                          |
| Blocking inputs | School sign-off on §2 decisions; Supabase + Vercel accounts for environments.                                                                                                                                  |

The root-level `school_administration_implementation_plan.md` is a byte-identical copy of the attached original (SHA-256 verified) — treat repo root as the canonical home.

## 2. Decisions to lock in Phase 0 (defaults I will proceed on)

These are the only genuinely open choices. Defaults are the most reasonable reading of the requirements doc; any can be overridden before WP1 ends.

| #   | Decision           | Default                                                                                                                               | Rationale / alternative                                     |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| D1  | Tenancy            | Single school at launch; **every table keeps `school_id` + RLS from day 1**                                                           | Companion doc §6; cheapest path to multi-school later       |
| D2  | UI language        | Arabic-first RTL, English toggle; default locale `ar`                                                                                 | Companion doc §1                                            |
| D3  | Auth method        | Supabase email + password; accounts created by admin invitation only; no self sign-up; magic links optional later                     | Schools control staff accounts                              |
| D4  | Notifications      | In-app only at launch; email deferred until a provider is reviewed                                                                    | Companion doc §8                                            |
| D5  | Respondent privacy | Dashboards show department + job title only; identity stored in a restricted, audited record; UI copy explains this honestly          | Companion doc §5.1 privacy rule                             |
| D6  | Timezone           | One configurable school timezone, set at bootstrap; all timestamps stored `timestamptz`                                               | Companion doc §3                                            |
| D7  | Hosting            | Vercel Hobby + two Supabase projects (dev, prod)                                                                                      | Companion doc §2, §9 Phase 1                                |
| D8  | Attachment limits  | 10 MB/file; jpg, png, webp, pdf; validated server-side; adjustable in Settings                                                        | Companion doc §5.4, §7                                      |
| D9  | Deletion policy    | Soft-delete/archive for circulars, requests, calendar events; deactivate (never delete) users                                         | Companion doc §3                                            |
| D10 | Theme              | Dark mode follows system preference by default; manual light/dark/system toggle, persisted per browser; class-based Tailwind strategy | Print views always render light regardless of active theme  |
| D11 | Code modularity    | **Non-negotiable:** one function per file, file named after the function, hard size caps enforced by CI                               | Rules and exceptions in §4.1                                |
| D18 | Confirmation UX    | Standardized in-app `AppMessageBox` dialog replacing native browser `confirm()` calls across all actions                              | Accessible, theme-aware, responsive confirmation dialog     |
| D19 | Maintenance Role   | Strict `operator` role filtering for technicians; absence alert banner + settings redirect when empty                                 | Prevents assigning maintenance tasks to non-technical staff |
| D20 | Weekend Policy     | Friday & Saturday locked as non-working holidays; scheduling prevented client/server; recurrence skips weekends                       | Preserves institutional working schedule                    |
| D21 | Settings Sub-Tabs  | School profile organized into 6 focused sub-tabs (Identity, Leadership, Contact, Academic Year, Vision, Operations)                   | Reduces form cognitive load                                 |

**Exit gate WP0:** school management approves D1–D21 and the §6 permission matrix. Outcomes recorded in `docs/decisions.md`.

## 3. Pinned stack (exact versions fixed at WP1)

| Layer                 | Choice                                                                               | Notes                                                                  |
| --------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Framework             | Next.js (App Router), TypeScript strict mode                                         | Server components by default; client components only for interactivity |
| UI kit                | Tailwind CSS + shadcn/ui primitives                                                  | Accessible, RTL-friendly, MIT; accelerate forms/tables/dialogs         |
| Theming               | next-themes + Tailwind `dark:` class strategy                                        | Dark mode (D10): system default, persisted toggle, no flash on load    |
| Forms & validation    | React Hook Form + Zod schemas shared client/server                                   | Companion doc §2                                                       |
| i18n                  | next-intl, locales `ar` (RTL, default) and `en`                                      | Companion doc §1                                                       |
| Data / Auth / Storage | Supabase JS v2; `@supabase/ssr` for session cookies; service-role client server-only | Companion doc §3                                                       |
| DB tooling            | Supabase CLI; numbered SQL migrations in Git                                         | Companion doc §3                                                       |
| Tests                 | Vitest + React Testing Library; Playwright e2e; SQL/RLS integration tests            | Companion doc §10                                                      |
| Quality               | ESLint (max-lines, single-export, complexity), Prettier, strict tsconfig, CI gates   | Companion doc §11; modularity enforced per §4.1                        |
| Notifications         | `notifications` table + unread counter (in-app)                                      | Companion doc §8                                                       |
| Reports               | Server-rendered tables + CSV export; charts deferred; PDF deferred until required    | Companion doc §8                                                       |

## 4. Repository structure

```
School_Administration_Portal/
├── .github/workflows/ci.yml        # PR pipeline (§10)
├── .env.example                    # placeholder values only
├── middleware.ts                   # session refresh + locale detection
├── docs/
│   ├── decisions.md                # D1–D9 outcomes, signed off
│   └── runbooks/                   # admin guide, backup/restore, incident process (WP8)
├── supabase/
│   ├── config.toml
│   ├── migrations/                 # 0001_core.sql … numbered, additive-first
│   ├── seeds/                      # test environment ONLY
│   └── tests/                      # RLS / constraint SQL tests
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (public)/           # school info, public calendar — no auth
│   │   │   ├── (auth)/             # login, password reset
│   │   │   ├── (app)/              # authenticated shell
│   │   │   │   ├── dashboard/
│   │   │   │   ├── circulars/
│   │   │   │   ├── maintenance/
│   │   │   │   ├── calendar/
│   │   │   │   ├── reports/
│   │   │   │   ├── settings/       # profile, departments, locations, users, roles, policies
│   │   │   │   └── notifications/
│   │   │   └── owner/              # application-owner area (platform settings, audit)
│   │   └── api/                    # route handlers (exports, webhooks)
│   ├── actions/                    # server actions; one function per file (§4.1)
│   ├── components/ui/              # design-system primitives
│   ├── components/theme/           # ThemeProvider + light/dark/system toggle (D10)
│   ├── components/<module>/        # feature components
│   ├── lib/                        # one function per file (§4.1)
│   │   ├── supabase/               # server / browser / admin clients
│   │   ├── auth/                   # session, getCurrentProfile()
│   │   ├── rbac/                   # permission catalog, can(), server guards
│   │   ├── validation/             # Zod schemas
│   │   ├── audit/  notifications/  storage/  i18n/
│   └── types/
└── tests/e2e/                      # Playwright suites SC01–SC12
```

### 4.1 Modularity rules (D11 — non-negotiable)

The codebase is strictly modular: **every function lives in its own file. No big files, ever.**

- One exported function per file; the file is named after the function — `publishCircular.ts` exports `publishCircular()`.
- Same rule for React components (one component per file), Zod schemas (one schema per file), constants, and helpers.
- Shared logic is extracted until each file does exactly one thing: `lib/<domain>/<verb><Noun>.ts`.
- Every folder exposes a barrel `index.ts`; imports go through barrels or the exact file. Tests follow the same rule — one unit under test per test file.
- Hard caps enforced by ESLint and CI (build fails on violation): `max-lines` ~300 — a file may remain **one cohesive unit** (a component and its tightly-coupled sub-parts, e.g. a shadcn primitive) up to that bound, `max-lines-per-function` 80, `complexity` ≤ 10, single export per file.
- Allowed exceptions: barrel files, type-only files, generated code, SQL migrations, config files.

Example granularity:

```
src/actions/circulars/
├── createCircularDraft.ts       # exports createCircularDraft()
├── publishCircular.ts           # exports publishCircular()
├── respondToCircular.ts         # exports respondToCircular()
├── closeCircular.ts             # exports closeCircular()
├── computeOverdue.ts            # shared helper — same rule
└── index.ts                     # barrel only

src/lib/rbac/
├── can.ts                       # can(profile, action, scope?)
├── getEffectivePermissions.ts
├── assertPermission.ts
└── index.ts
```

Work-package sizes in §7 already include the extra file count this produces.

## 5. Data model (migrations 0001+)

Conventions: UUID PKs; `created_at`/`updated_at` `timestamptz`; `school_id` on every school-scoped table; FK + index on every scope/foreign column; statuses as Postgres enums.

| Table                                        | Key columns beyond identity/scope/timestamps                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schools`                                    | name_ar, name_en, slug (unique), timezone, is_active                                                                                                                                                    |
| `school_settings`                            | school_id PK/FK; typed columns for searchable values + jsonb policy blobs (Zod-validated)                                                                                                               |
| `profiles`                                   | id = auth.users.id; full_name, email, job_title, school_id, department_id, is_active, last_seen_at                                                                                                      |
| `departments`                                | name_ar, name_en, head_profile_id, is_active                                                                                                                                                            |
| `locations`                                  | building, floor, room, kind                                                                                                                                                                             |
| `roles` / `permissions` / `role_permissions` | role key + school scope (system roles vs school roles); permission key e.g. `circular.publish`                                                                                                          |
| `user_role_assignments`                      | user_id, role_id, school_id, department_id (nullable), assigned_by; unique per (user, role, school, dept)                                                                                               |
| `circulars`                                  | ref_number (unique per school), title, body, category, priority, status, response_type, response_instructions, publish_at, due_at, created_by, closed_at                                                |
| `circular_targets`                           | circular_id, department_id nullable, role_id nullable                                                                                                                                                   |
| `circular_responses`                         | circular_id, department_id, responder_profile_id, status, reason, submitted_at, is_latest, revision_of                                                                                                  |
| `circular_attachments`                       | circular_id, storage path, mime, size, uploaded_by                                                                                                                                                      |
| `maintenance_requests`                       | ticket_number (unique per school), title, description, category, location_id, asset_ref, reporter_id, priority, status, target_response_at, target_resolution_at, resolved_at, closed_at, reopen_reason |
| `maintenance_assignments`                    | request_id, operator_id, assigned_by, assigned_at, is_active                                                                                                                                            |
| `maintenance_updates`                        | request_id, author_id, kind (note / status_change / priority_change), old_value, new_value, reason                                                                                                      |
| `maintenance_attachments`                    | request_id, kind (report / completion evidence), path, mime, size, uploaded_by                                                                                                                          |
| `calendar_events`                            | title_ar/en, description, category, starts_at, ends_at, all_day, visibility (public/internal), status (draft/published/cancelled/archived), location, image_path, created_by                            |
| `notifications`                              | user_id, type, payload jsonb, entity ref, read_at; index (user_id, read_at)                                                                                                                             |
| `audit_logs`                                 | school_id, actor_id, action, entity_type, entity_id, safe metadata jsonb; **insert-only** (REVOKE UPDATE/DELETE)                                                                                        |
| `system_settings`                            | key PK, value jsonb, updated_by/updated_at — owner-only                                                                                                                                                 |
| `file_metadata`                              | bucket, path, owner_id, school_id, mime, size, purpose, retention_until                                                                                                                                 |

**Enums:** circular_status `draft|published|in_progress|completed|overdue|archived|cancelled`; response_status `pending|acknowledged|approved|rejected|completed|not_applicable`; maintenance_priority `emergency|urgent|medium|deferrable`; maintenance_status `submitted|triaged|assigned|in_progress|waiting_for_parts|resolved|closed|reopened|rejected`.

**Legal maintenance transitions** (enforced by DB function + server action):
`submitted → triaged|assigned|rejected` · `triaged → assigned` · `assigned → in_progress|waiting_for_parts` · `in_progress → waiting_for_parts|resolved` · `waiting_for_parts → in_progress` · `resolved → closed|reopened` · `closed → reopened` · `reopened → assigned|in_progress`

**Numbering:** per-school sequences via DB function — circulars `CIR-YYYY-NNNN`, maintenance tickets `MR-YYYY-NNNN`; unique `(school_id, number)`.

**Storage buckets:** `circular-attachments` (private), `maintenance-photos` (private), `public-assets` (public: logo, published event images). Signed URLs with short expiry; authorization verified server-side before issuance (companion doc §7).

**Audit triggers:** settings changes, role/permission changes, user activation changes, circular publish/amend/close, priority changes, closure/reopen, file access grants.

## 6. Initial permission matrix

Deny by default. Every server read/write re-checks permissions; RLS enforces school and department scope. No role-name checks scattered in code — one catalog in `lib/rbac/`.

| Permission                         | Owner              | School Admin               | Dept Head      | Staff | Operator        | Auditor |
| ---------------------------------- | ------------------ | -------------------------- | -------------- | ----- | --------------- | ------- |
| circular.create / publish / assign | –                  | ✔                          | –              | –     | –               | –       |
| circular.respond                   | –                  | –                          | ✔              | –     | –               | –       |
| circular.view_responses            | –                  | ✔ (grouped)                | –              | –     | –               | –       |
| maintenance.create                 | –                  | ✔                          | ✔              | ✔     | –               | –       |
| maintenance.assign                 | –                  | ✔                          | –              | –     | –               | –       |
| maintenance.update                 | –                  | ✔                          | –              | –     | ✔ (own tickets) | –       |
| maintenance.close                  | –                  | ✔                          | –              | –     | –               | –       |
| calendar.manage                    | –                  | ✔                          | –              | –     | –               | –       |
| settings.school.update             | –                  | ✔                          | –              | –     | –               | –       |
| users.manage                       | –                  | ✔                          | –              | –     | –               | –       |
| roles.manage                       | ✔ (platform roles) | ✔ (school role assignment) | –              | –     | –               | –       |
| settings.platform.update           | ✔                  | –                          | –              | –     | –               | –       |
| reports.view                       | –                  | ✔                          | ✔ (dept scope) | –     | –               | ✔       |
| audit.view                         | ✔                  | ✔ (school)                 | –              | –     | –               | ✔       |

Guards: users cannot modify their own roles; last active owner/admin protected from removal; disabled users lose access including active sessions; owner cannot casually read school operational content unless granted (companion doc §4).

## 7. Work packages (execution order)

Sizes assume one experienced developer; ranges include the test gates.

| WP  | Name                           | Key tasks                                                                                                                                                                                                                                                                                | Primary outputs                         | Test gate (from companion doc §9/§10)                                                                                                                                                          | Size   |
| --- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| WP0 | Requirements lock              | Confirm D1–D9, permission matrix, statuses, retention, public calendar fields; page map + wireframe sketches                                                                                                                                                                             | `docs/decisions.md`, approved matrix    | Management sign-off                                                                                                                                                                            | 2–3 d  |
| WP1 | Repo & environments            | Scaffold Next.js (strict TS), Tailwind, ESLint/Prettier with modularity gates (D11: one function per file, max-lines), env validation (`zod` on `process.env`), Vitest/Playwright wiring, GitHub Actions, Supabase dev+prod projects, Vercel previews, `.env.example`                    | Running app + green CI from clean clone | Clean install, typecheck, lint (incl. D11 gates), build, missing-env failure, secret scan                                                                                                      | 2–3 d  |
| WP2 | Database, auth, RLS, RBAC      | Migrations 0001+ (all §5 tables, enums, constraints, buckets); auth flows (sign-in/out, reset, activation); RBAC catalog + server guards; safe owner bootstrap; seed test users (test env only)                                                                                          | Secure foundation                       | **Do not proceed until:** unauthenticated denial, per-role allow/deny, cross-school, cross-department, direct API/IDOR, disabled users, role escalation, storage access — all pass             | 8–10 d |
| WP3 | Shared UI + settings           | App shell, nav, ui kit, tables/filters/pagination/dialogs/toasts, RTL layout, theme toggle (light/dark/system, D10); school profile, departments, locations, users, roles, policy settings; audit on sensitive changes                                                                   | Admin console usable                    | Form validation, unauthorized edits blocked, role changes audited, RTL, keyboard nav, mobile, contrast in both themes                                                                          | 6–8 d  |
| WP4 | Circulars & assignments        | Draft → validate → preview → publish (per-department recipient tasks); respond (ack/approve/reject+reason); grouped privacy dashboard; overdue + reminders; close/archive/amend with version history                                                                                     | Circular module complete                | Correct targeting, no cross-department delivery, required rejection reason, duplicate prevention, overdue/timezone boundaries, privacy leakage, attachment authorization, concurrent responses | 8–10 d |
| WP5 | Maintenance & services         | Submission + photo upload, ticketing, triage/assign, work notes, resolution + evidence, close/reopen, admin queue + dashboards, configurable SLA/escalation                                                                                                                              | Maintenance module complete             | Valid/invalid uploads, unauthorized ticket access, priority-change audit, legal transitions, duplicate submission, emergency escalation, closure requirements, dashboard accuracy              | 8–10 d |
| WP6 | Calendar & public pages        | Calendar CRUD + categories, draft/publish workflow, month+list views, School Achievements tab ("تسجيل إنجازات المدرسة") with departmental attribution & interactive detail viewer, public school info (overview, vision, mission, achievements), strict public/internal query separation | Public site + calendar + achievements   | Public/private boundary, draft invisibility, timezone/all-day events, date-range validation, mobile, data leakage                                                                              | 5–7 d  |
| WP7 | Notifications, reports, export | In-app notifications + unread counter + preferences + throttling/dedup; filtered reports; CSV export with server-side authorization                                                                                                                                                      | Reporting layer                         | Correct recipients, dedup, reminder scheduling, export permissions, CSV formula injection guard, Arabic text integrity, totals match DB                                                        | 5–7 d  |
| WP8 | Hardening & launch             | Full regression, security + accessibility passes, independent RLS/Storage policy review, quota monitoring, backup/restore drill, admin/user guides, pilot group, rollback plan                                                                                                           | Release candidate                       | All release-blocking tests pass; no unresolved critical/high findings; backups verified; school sign-off                                                                                       | 5–8 d  |

**Dependency rule (companion doc §13):** no feature module starts before WP2's authorization gates pass. WP3's UI kit feeds WP4–WP7; everything else is sequential.

## 8. Indicative timeline (single developer, sequential)

| Week          | Work      | Milestone                                      |
| ------------- | --------- | ---------------------------------------------- |
| W1            | WP0 + WP1 | **M0** — decisions locked, scaffold + CI green |
| W2–W3         | WP2       | **M1** — secure foundation (auth + RLS proven) |
| W3–W4         | WP3       | **M2** — admin console & settings usable       |
| W5–W6         | WP4       | Circulars live                                 |
| W6–W7         | WP5       | **M3** — core operations live (pilot-ready)    |
| W8            | WP6       | Calendar + public pages                        |
| W9            | WP7       | **M4** — feature complete                      |
| W10 (+buffer) | WP8       | **M5** — launch                                |

Total ≈ 50–66 dev-days. Treat as indicative; the test gates, not dates, are the commitments.

## 9. Test strategy mapping

| Layer                                                                      | Runs                     | Phases       |
| -------------------------------------------------------------------------- | ------------------------ | ------------ |
| Unit (permissions, validators, transitions, SLA, timezones)                | Vitest, every PR         | WP2 onward   |
| Component (forms, role-dependent UI, RTL)                                  | Vitest + RTL, every PR   | WP3 onward   |
| Integration (server actions, constraints, RLS, storage, audit)             | CI against disposable DB | WP2 onward   |
| E2E scenarios SC01–SC12                                                    | Playwright               | per WP below |
| Security / a11y (WCAG contrast in light and dark) / performance / recovery | WP8 full pass            | WP8          |

E2E suite = companion doc §10 scenarios, mapped: SC01–SC04 → WP4 · SC05–SC06 → WP5 · SC07 → WP6 · SC08–SC10 → WP2/WP3 · SC11 → WP7 · SC12 → WP2/WP8.

## 10. CI/CD (GitHub Actions)

Every PR: install from lockfile → format/lint + modularity gates (one function per file, max-lines, complexity) → typecheck → unit + component tests → apply migrations to disposable DB → RLS/integration tests → Playwright smoke (preview where practical) → production build → dependency + secret scan.

Before any production migration: verified backup/export, destructive-op review, tested on schema copy, additive-first (expand–migrate–contract for breaks), rollback documented, explicit approval for destructive changes. Never reset/drop production data to fix a migration.

## 11. Environments, secrets, backups

- **Projects:** Supabase `dev` + `prod`; Vercel preview + production. Destructive tests only in dev/test.
- **`.env.example` keys:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, never `NEXT_PUBLIC_`), `SCHOOL_TIMEZONE`, `APP_URL`.
- **Backups:** scheduled exports from WP2 onward; restore drill in WP8 into a non-production project.
- **Local execution:** I can scaffold, code, migrate (via Supabase CLI against the dev project), and test inside this workspace. Steps marked ⛔ need you: creating Supabase/Vercel accounts and supplying credentials.

## 12. Risks

| Risk                                      | Impact                    | Mitigation                                                                      |
| ----------------------------------------- | ------------------------- | ------------------------------------------------------------------------------- |
| Free-tier quotas / inactivity pauses      | Outage or blocked deploys | Monitor usage from WP1, backups + export plan, documented upgrade path (doc §2) |
| RLS policy mistake leaks data             | Serious                   | Policies written & tested before features (WP2), independent review in WP8      |
| Arabic PDF generation complexity          | Report delays             | Deferred: CSV first; real text PDF with RTL shaping only if required (doc §8)   |
| Timezone/DST defects in due dates         | Wrong overdue flags       | Single school tz, boundary tests in WP2/WP4                                     |
| Multi-school scope creep                  | Rework                    | Schema keeps `school_id`+RLS from day 1; UI stays single-school until asked     |
| Privacy expectation mismatch on responses | Trust damage              | D5 + UI copy explains exactly what admins can see (doc §5.1)                    |
| Solo-developer bus factor                 | Schedule                  | Small PRs, CI gates, runbooks in WP8                                            |
| Over-atomization hurts discoverability    | Slower navigation         | Barrel files, strict file=function naming, folders grouped by domain (§4.1)     |

## 13. Sprint 0 — first actions on approval

1. Confirm or override D1–D11 (silence = proceed on defaults).
2. Scaffold in this workspace: `create-next-app` (TS strict, src dir, App Router) → shadcn/ui init → install `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, `@hookform/resolvers`, `next-intl`, `next-themes`, dev deps (Vitest, RTL, Playwright, Prettier) → Supabase CLI init + migration 0001 skeleton → CI workflow → first PR.
3. ⛔ From you: Supabase + Vercel accounts/keys, school profile content (Arabic/English names, logo, vision/mission, contacts), and department/staff list for seeds.

**Immediate deliverable after Sprint 0:** WP1 exit — clean clone produces a typed, linted, tested, building app with green CI and documented environment setup.
