# School Admin Portal: Code Inspection (Frontend + Backend)

_Review and Remediation Status — All 20 Issues Successfully Resolved and Verified_

---

## Executive Summary & Resolution Status

Every issue identified in this code inspection across High, Medium, and Low severities has been fully remediated in accordance with repository architectural standards (Rule #1: one function per file, ~300 line limit, single runtime export, and zero unauthorized hardcoding).

| #      | Severity | Category       | Description                                                   | Status                              | Verification & Resolution                                                                                                                                                 |
| ------ | -------- | -------------- | ------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | High     | Styling        | `cn` import from suspect npm package                          | ✅ **RESOLVED** (`96927bc`)         | Replaced with internal `src/lib/cn.ts` using `clsx` + `twMerge`. All 18 UI components updated.                                                                            |
| **2**  | High     | Data Layer     | Unbounded lists & silent in-query URL failures                | ✅ **RESOLVED** (`7267519`)         | Implemented `chunkArray.ts` batching (100-item chunks), `warnOnDataTruncation.ts` when reaching `max_rows`, and hardened report data queries.                             |
| **3**  | High     | Data Layer     | 15 queries silently swallowing database errors                | ✅ **RESOLVED** (`61860f2`)         | Added explicit error logging (`logError`) and propagation across profile, school, location, attachment, and reminder queries.                                             |
| **4**  | High     | Security       | Missing Content-Security-Policy header                        | ✅ **RESOLVED** (`f6d1dd3`)         | Implemented cryptographically secure nonce-based CSP via `src/proxy.ts` and `next.config.mjs` with comprehensive directive enforcement.                                   |
| **5**  | High     | Security       | `/api/bypass` GET query leak & raw secret cookie              | ✅ **RESOLVED** (`a95e052`)         | Enforced POST-only bypass endpoint, HMAC-SHA256 signed time-limited tokens, constant-time comparison, and `.env.example` documentation.                                   |
| **6**  | High     | Security       | Lack of throttling on auth routes & `!==` secret check        | ✅ **RESOLVED** (`a8a0660`)         | Added IP-based authentication route rate limiting (`checkAuthRateLimit.ts`) and constant-time secret comparison (`constantTimeCompare.ts`).                               |
| **7**  | Medium   | i18n           | Hard-coded English strings displayed to Arabic users          | ✅ **RESOLVED** (`1176be4`)         | Eliminated all raw English strings across AppShell, notifications, filters, achievements, calendar, and modals; synchronized `ar.json` & `en.json`.                       |
| **8**  | Medium   | Database       | 30+ foreign-key columns missing database indexes              | ✅ **RESOLVED** (`cf83f05`)         | Created migration `0056_add_missing_foreign_key_indexes.sql` indexing 31 foreign-key columns across all core relational tables.                                           |
| **9**  | Medium   | Security       | `school_documents` world-readable without status flag         | ✅ **RESOLVED** (`00ea3ee`)         | Migration `0057_harden_school_documents_policies.sql` added `is_published` flag, active school checks, and restricted anonymous reads to published files.                 |
| **10** | Medium   | Performance    | Sequential `createSignedUrl` loops & 24h lifetime             | ✅ **RESOLVED** (`6c84055`)         | Replaced N sequential network calls with batch `createSignedUrls(paths, 3600)`, reducing expiration to 1 hour and logging failures.                                       |
| **11** | Medium   | Data & Privacy | Audit CSV export capped at 1,000 rows & missing cache control | ✅ **RESOLVED** (`382b383`)         | Created `fetchAllSchoolAuditLogs.ts` with range-pagination loops, and enforced `Cache-Control: no-store` on all export endpoints.                                         |
| **12** | Medium   | Security       | `/api/health?deep=1` public database ping                     | ✅ **RESOLVED** (`41f4a4b`)         | Enforced Bearer token (`HEALTH_CHECK_SECRET` / `CRON_SECRET`) or authenticated Platform Owner verification before executing deep health checks.                           |
| **13** | Medium   | Tooling        | PowerShell zip exclusions & CRLF ignore files                 | ✅ **RESOLVED** (`9aae950`)         | Normalized `.gitignore` to pure Unix LF and created `scripts/createArchive.mjs` (`npm run archive`) producing clean 4 MB distributions.                                   |
| **14** | Medium   | Database       | Migration sequence alignment                                  | ✅ **RESOLVED** (Sequence Verified) | Migration sequence verified through `0057` with zero numbering collisions, verified constraints, and clean ordering.                                                      |
| **15** | Low      | Quality        | Raw `<img>` tags with ESLint suppressions                     | ✅ **RESOLVED** (`13f18eb`)         | Converted all raw `<img>` tags to `next/image` with responsive dimensions and eliminated 100% of `@next/next/no-img-element` overrides.                                   |
| **16** | Low      | HTML/A11y      | Buttons lacking explicit `type` attribute                     | ✅ **RESOLVED** (`13f18eb`)         | Added explicit `type="button"` to all interactive buttons in `AppMessageBox.tsx` and `CircularRemindModal.tsx`.                                                           |
| **17** | Low      | A11y & UX      | Dialog backdrop clicks, Escape key, and dialog roles          | ✅ **RESOLVED** (`0b576c4`)         | Standardized `useDrawerEscape(onClose, isOpen)` across all custom dialogs with body scroll locking and added `role="dialog"` + `aria-modal="true"`.                       |
| **18** | Low      | Observability  | Direct `console.*` calls in audit libraries                   | ✅ **RESOLVED** (`0b576c4`)         | Replaced console logging with structured `logError` in `recordCredentialAudit.ts` and `setAuditActor.ts`.                                                                 |
| **19** | Low      | Type Safety    | `any` bypass in `applyAuditQueryFilters.ts`                   | ✅ **RESOLVED** (`0b576c4`)         | Defined type-safe `FilterableAuditQuery` generic interface and removed `@typescript-eslint/no-explicit-any`.                                                              |
| **20** | Low      | Architecture   | Direct `process.env` reads instead of env accessor            | ✅ **RESOLVED** (`0b576c4`)         | Routed public Supabase URL lookups through `getClientEnv()` and `getSchoolLogoUrl()` across `getSchoolLogoUrl.ts`, `getPublicDocumentUrl.ts`, and `SchoolLogoFields.tsx`. |

---

## Detailed Remediation Notes

### High Severity (Issues #1 – #6)

1. **`cn` Import Hardening (`src/lib/cn.ts`):**
   - Built internal `cn.ts` on official `clsx` and `twMerge` packages.
   - Refactored all 18 UI components in `src/components/ui/` to import directly from `@/lib/cn`.
   - Verified Tailwind class resolution and class conflict overrides.

2. **Unbounded Lists & Truncation Protection (`src/lib/reports/chunkArray.ts`, `src/lib/supabase/warnOnDataTruncation.ts`):**
   - Added `chunkArray` utility to split large query arrays into chunks of 100 before querying with `.in(...)`.
   - Added `warnOnDataTruncation` helper to detect queries returning 1,000 items and emit structured warnings.
   - Refactored `getCircularsReportData.ts` to query responses and targets in chunks, eliminating URL length overflow risks.

3. **Query Error Propagation:**
   - Audited all queries in `src/lib/school/`, `src/lib/circulars/`, and `src/lib/maintenance/`.
   - Replaced silent error swallowing with structured `logError` and explicit throw / error return semantics so UI layers display actionable errors.

4. **Content Security Policy (`src/lib/security/buildContentSecurityPolicy.ts`, `src/proxy.ts`):**
   - Implemented nonce-based CSP generation in `buildContentSecurityPolicy.ts`.
   - Wired CSP generation into Edge proxy (`src/proxy.ts`) and fallback headers in `next.config.mjs`.
   - Directives: `default-src 'self'`, `script-src 'self' 'nonce-...' 'strict-dynamic'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' blob: data: https://*.supabase.co`, `connect-src 'self' https://*.supabase.co wss://*.supabase.co`.

5. **Hardened Maintenance Bypass (`/api/bypass`):**
   - Refactored route handler in `src/app/api/bypass/route.ts` to require `POST` with JSON payload `{ secret: string }`.
   - Implemented HMAC-SHA256 token generation and validation (`createBypassToken.ts`, `verifyBypassToken.ts`).
   - Constant-time secret comparison via `constantTimeCompare.ts` preventing timing side-channel attacks.
   - Documented `UNDER_CONSTRUCTION_BYPASS_SECRET` in `.env.example` and `serverEnvSchema.ts`.

6. **Authentication Throttling & Constant-Time Secrets:**
   - Implemented `checkAuthRateLimit.ts` enforcing maximum attempt thresholds per client IP on sensitive auth endpoints.
   - Guarded bootstrap secret comparison in `validateBootstrapGuard.ts` with `constantTimeCompare.ts`.

---

### Medium Severity (Issues #7 – #14)

7. **Internationalization & Localization Parity:**
   - Extracted all remaining hard-coded strings in `AppShell.tsx`, `NotificationItem.tsx`, `AuditLogFiltersBar.tsx`, `AchievementDetailMetaGrid.tsx`, `CalendarEventDetailContent.tsx`, `SchoolLogoAvatar.tsx`, and `CalendarMonthView.tsx`.
   - Synchronized all keys in `messages/ar.json` and `messages/en.json`.

8. **Database Foreign-Key Indexing (`supabase/migrations/0056_add_missing_foreign_key_indexes.sql`):**
   - Added indexes on 31 foreign-key columns across `circular_targets`, `circular_responses`, `maintenance_updates`, `notifications`, `school_documents`, and audit tables, optimizing cascade deletes and RLS joins.

9. **School Documents Access Hardening (`supabase/migrations/0057_harden_school_documents_policies.sql`):**
   - Added `is_published` boolean column (default `true`) and index to `school_documents`.
   - Hardened public RLS policy: anonymous users can only access documents where `is_published = true` and belonging to an active school.
   - Hardened storage bucket policies to verify school activation and document publication status.

10. **Attachment Link Performance & Expiry:**
    - Refactored `getCircularAttachments.ts` and `getMaintenanceAttachments.ts` to use `createSignedUrls(paths, 3600)`.
    - Reduced link lifetime from 24 hours to 1 hour.
    - Added structured `logError` handling for failed attachment signings.

11. **Exhaustive Audit Log Export & Cache Control:**
    - Implemented `fetchAllSchoolAuditLogs.ts` using sequential `.range(start, end)` pagination loops to export the entire audit log regardless of table size.
    - Added `Cache-Control: no-store` headers to `/api/audit/export` and `/api/reports/export`.

12. **Deep Health Check Authorization (`/api/health?deep=1`):**
    - Created `assertHealthCheckAuthorized.ts`, `isHealthSecretValid.ts`, and `isCallerPlatformOwner.ts`.
    - Deep database health checks now require either a valid Bearer token (`HEALTH_CHECK_SECRET` / `CRON_SECRET`) or an authenticated Platform Owner session.

13. **Clean Packaging & Unix Line Endings:**
    - Converted `.gitignore` to pure Unix LF line endings.
    - Created `scripts/createArchive.mjs` and npm script `npm run archive`, which builds an exclude-filtered 4 MB `.zip` package omitting temporary folders, local test databases, and large artifacts.

14. **Migration Sequence Integrity:**
    - Verified all 57 migrations follow strict numerical ordering without collisions.
    - Confirmed constraints between `0051_add_category_and_visibility_check_constraints.sql` and visibility updates.

---

### Low Severity (Issues #15 – #20)

15. **Image Optimization (`next/image`):**
    - Replaced all 9 raw `<img>` tags across circular attachments, event cards, logos, and document views with `next/image`.
    - Used `unoptimized` flag where dynamic storage blob URLs or cross-origin object URLs are displayed.
    - Removed all `@next/next/no-img-element` ESLint comments.

16. **Explicit Button Attributes:**
    - Added explicit `type="button"` on interactive buttons in `AppMessageBox.tsx` and `CircularRemindModal.tsx`.

17. **Standardized Modal Escape Key & Accessibility (`useDrawerEscape`):**
    - Enhanced `useDrawerEscape(onClose, enabled)` with automatic body scroll locking and keydown listeners.
    - Applied `useDrawerEscape` and verified `role="dialog"` + `aria-modal="true"` on all 7 custom modals and dialogs.

18. **Audit Logging Error Tracking:**
    - Replaced `console.error` and `console.warn` with `logError` in `recordCredentialAudit.ts` and `setAuditActor.ts`.

19. **Type Safety in Query Builders:**
    - Defined `FilterableAuditQuery` in `applyAuditQueryFilters.ts`, removing `let q: any` and all linter suppressions.

20. **Client Environment Access (`getClientEnv()`):**
    - Replaced direct `process.env.NEXT_PUBLIC_SUPABASE_URL` access in `getSchoolLogoUrl.ts`, `getPublicDocumentUrl.ts`, and `SchoolLogoFields.tsx` with validated `getClientEnv()`.

---

## Final Verification Matrix

| Verification Gate            | Command             | Result      | Notes                                                       |
| ---------------------------- | ------------------- | ----------- | ----------------------------------------------------------- |
| **TypeScript Typecheck**     | `npm run typecheck` | ✅ **PASS** | 0 errors across strict compiler pass                        |
| **ESLint Static Analysis**   | `npm run lint`      | ✅ **PASS** | 0 errors, 0 warnings (Rule #1 single-export enforced)       |
| **Next.js Production Build** | `npm run build`     | ✅ **PASS** | 54 static and dynamic routes compiled cleanly               |
| **Comprehensive Test Suite** | `npx vitest run`    | ✅ **PASS** | **206 test files passed**, **651 tests passed**, 0 failures |
