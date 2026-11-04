# School Admin Portal: Inspection Report

**Date:** 31 October 2026
**Subject:** `school-admin-portal_1.zip` (2,271 files; 915 in `src`; 53 SQL migrations)
**Method:** Static review plus a small executable check of the compliance functions.
**Not run:** `tsc`, ESLint, Vitest, the build, and the RLS battery. The zip had no `node_modules` and there was no network access. Run the commands in section 8 to cover what a static read cannot.

---

## 1. Summary

| Severity   | Count                    | Theme                                                                                            |
| ---------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| High       | 6                        | Class-name utility, silent data loss, ignored errors, missing CSP, bypass route, auth throttling |
| Compliance | 10 calculation + 1 chart | Wrong and inconsistent percentages; donut hides the departments that need attention              |
| Medium     | 8                        | Hard-coded English, missing indexes, public documents, signed URLs, export caps, repo hygiene    |
| Low        | 6                        | Raw images, buttons without type, dialog backdrops, console, `any`, direct `process.env`         |

**What to do first:** verify and fix the `cn` import (H1), fix the compliance calculation (section 4), add the CSP (H4), then fix the data layer (H2, H3).

---

## 2. High-severity findings

| ID  | Where                                                                                                                                                                                                                                               | Problem                                                                                                                                                                                                                                            | Impact                                                                                                                                                                                                                                                        | Fix                                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | 18 files import `{ cn }` from `"cn"` (all of `components/ui`, plus `NavLink`, `SettingsNav`, `DepartmentTarget*`, `error.tsx`, `not-found.tsx`)                                                                                                     | npm package `cn@0.5.0` has a `bin` and no dependencies in `package-lock.json`, which looks like a command-line tool and not a class merger. `clsx` and `tailwind-merge` are installed but never imported. What `cn` exports was **not confirmed**. | If it does not merge conflicting Tailwind classes, every `className` override on shared components (for example `h-9` over `h-8`) depends on CSS order, and many styles break unpredictably.                                                                  | Check: `node -e "console.log(require('cn'))"`. Add `src/lib/cn.ts` using `clsx` + `twMerge`, change the 18 imports, remove the `cn` dependency.                              |
| H2  | `lib/circulars/getSchoolCirculars.ts`, `lib/maintenance/getSchoolMaintenanceRequests.ts`, `lib/calendar/getSchoolCalendarEvents.ts`, `lib/reports/getCircularsReportData.ts`, `lib/reports/getMaintenanceReportData.ts` (full list in appendix A.2) | Every list loads all rows with nested targets and attachments. No pagination. Filtering and sorting happen in JavaScript. `supabase/config.toml:9` has `max_rows = 1000`.                                                                          | Beyond 1,000 rows data is silently cut. Pages get slower as data grows. In `getCircularsReportData.ts` (lines 44, 52) `.in("circular_id", ids)` with up to 1,000 UUIDs can exceed URL limits and fail, and the error is discarded, so the report shows zeros. | Server-side filtering, sorting and pagination (`.range`), count queries for totals, batch `.in()` lists in chunks of about 100, return an error state when a query fails.    |
| H3  | 15 queries (appendix A.1), including `getCurrentProfile.ts:22`, `getCurrentSchool.ts:40,49`, `getSchoolLocations.ts:19`, `getMaintenanceAttachments.ts:20`                                                                                          | `const { data } = await supabase...` discards `error`.                                                                                                                                                                                             | A database error looks like "no data". `getCurrentProfile` failing looks like "no profile" and logs people out.                                                                                                                                               | Read `error`, throw through `mapDatabaseError` (as `getSchoolDepartments.ts` already does) or return a typed failure. Add a test per helper.                                 |
| H4  | `next.config.mjs`, `src/proxy.ts`                                                                                                                                                                                                                   | Security headers exist (HSTS, frame, nosniff, referrer) but there is **no Content-Security-Policy**.                                                                                                                                               | No second line of defence against script injection.                                                                                                                                                                                                           | Nonce-based CSP set in `proxy.ts`; allow only your own origin, the Supabase project, and fonts; start in report-only mode.                                                   |
| H5  | `src/app/api/bypass/route.ts`                                                                                                                                                                                                                       | The secret travels in the query string (ends up in logs and history). The comparison uses `!==`. The 30-day cookie's value is the secret itself. `UNDER_CONSTRUCTION_BYPASS_SECRET` is not in `.env.example` or the env schema. No rate limit.     | Anyone who sees a URL or cookie has permanent bypass.                                                                                                                                                                                                         | Accept the secret by POST, compare with `timingSafeEqual`, set a random signed token with a short expiry, add the variable to the env schema and `.env.example`, rate-limit. |
| H6  | `actions/auth/loginAction.ts`, `requestPasswordResetAction.ts`, `claimPlatformOwnerAction.ts`, `validateBootstrapGuard.ts`                                                                                                                          | No app-level throttling. The only rate limiter (`consumeRateLimitToken`) is in memory and used only by `/api/client-errors`; its own comment says it is not a security control. The bootstrap secret is compared with `!==`.                       | You rely entirely on Supabase Auth limits. Brute force and email flooding are not limited by the app.                                                                                                                                                         | DB-backed limiter keyed by IP and email, `timingSafeEqual` for secrets, generic error messages.                                                                              |

---

## 3. Medium and low findings

### Medium

| ID  | Where                                                                     | Problem                                                                                                                                                                                                                                                                                                                            | Fix                                                                                            |
| --- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| M1  | About 25 places (appendix A.3)                                            | Hard-coded English in the UI (labels, placeholders, `aria-label`, alt text). Arabic users see English. The translation files themselves are in parity (769 keys each).                                                                                                                                                             | Move each string to `en.json` and `ar.json`; keep parity.                                      |
| M2  | 30 foreign-key columns without any index (appendix A.4)                   | `school_id` and user-reference columns are used by RLS checks and cascade deletes.                                                                                                                                                                                                                                                 | One new migration adding the indexes.                                                          |
| M3  | `school_documents` policy `using (true)` for `anon`; the bucket is public | Every school's documents are world-readable and the table has no draft state.                                                                                                                                                                                                                                                      | Confirm intent. If not intended, add a published flag and restrict.                            |
| M4  | `lib/circulars/getCircularAttachments.ts`                                 | Signed URLs are created one at a time in a loop and are valid for 24 hours.                                                                                                                                                                                                                                                        | `createSignedUrls` in one call; shorter expiry.                                                |
| M5  | `app/api/audit/export/route.ts`, `app/api/reports/export/route.ts`        | The audit export asks for one page of 1,000 rows and stops silently. Exports have no `Cache-Control: no-store`.                                                                                                                                                                                                                    | Stream or loop through pages; tell the user when a limit applies; add the header.              |
| M6  | `app/api/health/route.ts`                                                 | `?deep=1` pings the database for anyone.                                                                                                                                                                                                                                                                                           | Require the cron secret for the deep check.                                                    |
| M7  | Repo and zip hygiene                                                      | `.gitignore` has mixed CRLF and LF lines, so the CRLF patterns (`/coverage`, `/test-results`, `/playwright-report`, `supabase/.temp/`) do not match on Linux or in CI. A zip made with the earlier PowerShell script also contained `.zwork/` (includes `tmp/rls.env` with local keys), `.next-e2e/` (218 MB) and `test-results/`. | Normalise `.gitignore` to LF (and add `.gitattributes` rules); build zips from `git ls-files`. |
| M8  | Chatbot package (if applied)                                              | Its migration is named `0049_...` but migrations now run to `0053`. It was also not compared with `0051_add_category_and_visibility_check_constraints.sql`.                                                                                                                                                                        | Rename to the next free number and check for overlap before applying.                          |

### Low

| ID  | Where                                                                              | Problem                                                   | Fix                                                                                               |
| --- | ---------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| L1  | 8 files (appendix A.5)                                                             | Raw `<img>` tags, each with an eslint-disable.            | Use `next/image` where the source is static; keep `<img>` with a comment for signed or blob URLs. |
| L2  | `app/global-error.tsx:56`, `CircularRemindModal.tsx:55`, `ui/AppMessageBox.tsx:45` | `<button>` without `type`.                                | Add `type="button"`.                                                                              |
| L3  | 9 dialog backdrops (appendix A.6)                                                  | `div onClick` closes dialogs.                             | Confirm each has Esc handling, `role="dialog"`, `aria-modal`, and focus return.                   |
| L4  | Audit, logger and PWA libraries (appendix A.7)                                     | Direct `console.*`.                                       | Route through the logger.                                                                         |
| L5  | `lib/school/applyAuditQueryFilters.ts:9`                                           | One `any`.                                                | Type it.                                                                                          |
| L6  | 12 files (appendix A.8)                                                            | `process.env` read directly instead of through `lib/env`. | Read through the env module (public vars may stay where the client needs them).                   |

---

## 4. Compliance audit (dashboard)

### 4.1 How the numbers are built

`getDashboardComplianceData` calls `getCircularsReportData(schoolId)` with no filters. That function computes department rows with `computeDepartmentCompliance` (overall and per-department figures) and circular rows with `mapCircularReportRows` (per-circular figures). The dashboard shows the first 10 circulars with targets, sorted by creation date, and a donut built from `computeDonutSegments`.

### 4.2 Test scenario

Departments A, B, C active and D inactive. Circular C1 published (all departments), C2 draft, C3 published (A and B only), C4 cancelled. Responses: C1 by A (approved) and B (acknowledged); C3 by A (approved) and B (rejected).

| View                                                            | Result from the real functions             | Correct reading                                               |
| --------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| Overall                                                         | **3 / 11 = 27%**                           | 3 of 5 = 60% (only published circulars, rejected not counted) |
| Department A / B / C                                            | A 2 of 4, B 1 of 4, C 0 of 3               | A 2 of 2, B 1 of 2, C 0 of 1                                  |
| Circular C1                                                     | 2/3 = 67%                                  | 67% (correct)                                                 |
| Circular C2 (draft)                                             | 0/3 = 0%, shown in the list                | Should not be listed                                          |
| Circular C3                                                     | **2/2 = 100%** (B's response was rejected) | 1/2 = 50%                                                     |
| Circular C4 (cancelled)                                         | 0/3 = 0%, shown in the list                | Should not be listed                                          |
| Circular with one response from a department it was not sent to | **1/1 = 100%**, 0 departments responded    | 0 of its targets                                              |

### 4.3 Calculation problems

| ID  | File                                                           | Problem                                                                                                                                                                                                                       |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K1  | `getDashboardComplianceData.ts`, `getCircularsReportData.ts`   | No status filter: draft, cancelled and archived circulars add phantom "pending" targets. The dropdown default is the newest created circular, which can be a draft at 0%, and "Remind" is offered for it.                     |
| K2  | `computeDepartmentCompliance.ts` vs `mapCircularReportRows.ts` | "Responded" is defined twice. Department and overall: `acknowledged`, `approved`, `completed`. Per circular: any response, including `rejected`, `pending`, `not_applicable`. The views disagree.                             |
| K3  | `mapCircularReportRows.ts`                                     | `rec = respondedDepartments.length > 0 ? ... : circResponses.length` falls back to a raw count, which can produce a false 100%.                                                                                               |
| K4  | both files and `getCircularsReportData.ts`                     | Zero targets gives 100%. "No data" is shown as perfect compliance.                                                                                                                                                            |
| K5  | both files                                                     | `not_applicable` is not removed from the denominator.                                                                                                                                                                         |
| K6  | `getDashboardComplianceData.ts`                                | The "responded" list contains any department with some response (labelled with its percentage), and the "pending" list contains only departments with zero responses. A partly compliant department never appears as pending. |
| K7  | `getDashboardComplianceData.ts`                                | The reports page passes the user's department scope; the dashboard does not. Row-level security limits what each user can read, so totals are computed from visible rows only.                                                |
| K8  | all                                                            | Due dates are ignored, so "overdue" and "not yet due" look the same.                                                                                                                                                          |
| K9  | `computeDepartmentCompliance.ts`                               | Filters the target list inside two nested loops (departments × circulars × targets). With 20 departments, 1,000 circulars and 5,000 targets that is about 100 million operations per load.                                    |
| K10 | `getDashboardComplianceData.ts`                                | The 10 circulars shown are the 10 most recently created, not the most relevant (for example overdue or most recently published).                                                                                              |

### 4.4 Chart problems (current donut)

- **G1.** Each arc is a department's share of all responses received. A department with 0% has **no arc**, so the departments that need attention are invisible.
- With about 20 departments the 10-colour palette (`donutPalette.ts`) repeats, so colours cannot identify departments. The hex colours are hard-coded and not theme-aware.
- Round line caps make small arcs overlap neighbours.
- Detail is available on hover only (not keyboard or touch). The `aria-label` is hard-coded English.
- The centre number means two things (overall percent, then one department's rate when hovered).

### 4.5 Recommended chart

A headline number for overall compliance, then **departments as ranked horizontal bars, lowest compliance first**. Each bar is split into responded, overdue and not yet due, with a direct label such as `7/10 · 70%`. Show the lowest 5 with a control to show all. Use the theme's success, danger and muted colours. Keep the circular dropdown and the Remind button unchanged. A department × circular grid is a good later addition for "who has not answered which circular".

### 4.6 Proposed definition (change if you disagree)

- **Circulars counted:** `published`, `in_progress`, `completed`, `overdue`.
- **Compliant response:** `acknowledged`, `approved`, `completed`.
- **`rejected`:** not compliant.
- **`not_applicable`:** removed from the denominator.
- **Overdue:** a non-compliant target whose circular's `due_at` has passed.
- **No data:** show "no data", not 100%.
- **One shared function** used by the dashboard, the reports page and the exports.

---

## 5. What is already good

- No `dangerouslySetInnerHTML`, `eval`, or `document.write`; no source file over 300 lines.
- CSV formula injection is escaped; the auth callback blocks open redirects; SVG uploads are blocked (migration 0044).
- All 31 `security definer` functions set a search path.
- Every server action checks the user's permission and validates its input.
- Row-level security is enabled for every table, and an RLS test battery with a negative control exists.
- The translation files are in parity (769 keys each).
- A latest-response unique index on `circular_responses (circular_id, department_id)` prevents double counting.

---

## 6. Recommended order

1. H1 (`cn`), because it affects every component.
2. Section 4 (compliance calculation and chart), because the numbers are wrong today.
3. H4 (CSP) and H5 (bypass), then H6 (throttling).
4. H2 and H3 (data layer), then M2 (indexes), M4, M5, M6.
5. M1 (translations), M7, then the low items.

---

## 7. Appendices

### A.1 Queries that discard `error` (H3)

```
lib/auth/getCurrentProfile.ts:22
lib/circulars/getCircularAttachments.ts:19
lib/circulars/getCircularReminderMeta.ts:11
lib/circulars/getCircularReminderRecipients.ts:23, 36
lib/circulars/getDepartmentMemberUserIds.ts:10
lib/maintenance/getMaintenanceAttachments.ts:20
lib/notifications/isNotificationThrottled.ts:13
lib/reports/getCircularsReportData.ts:44, 52
lib/school/getCurrentSchool.ts:40, 49
lib/school/getFirstActiveSchoolId.ts:15
lib/school/getSchoolFullDetails.ts:16
lib/school/getSchoolLocations.ts:19
```

### A.2 List queries with no limit or range (H2)

```
actions/circulars/publishCircularAction.ts (circular_targets)
lib/achievements/getSchoolAchievements.ts
lib/auth/getPlatformOwnerUserIds.ts
lib/backup/resolveScopedRoleIds.ts
lib/calendar/getSchoolCalendarEvents.ts
lib/circulars/deleteCircularRecord.ts
lib/circulars/getCircularAttachments.ts
lib/circulars/getCircularReminderRecipients.ts (profiles, circular_targets)
lib/circulars/getCircularResponses.ts
lib/circulars/getDepartmentMemberUserIds.ts
lib/circulars/getPendingCircularDepartmentIds.ts
lib/circulars/getSchoolCirculars.ts
lib/documents/getPublicSchoolDocuments.ts
lib/documents/getSchoolDocumentsBySlug.ts
lib/maintenance/getMaintenanceAttachments.ts
lib/maintenance/getMaintenanceUpdates.ts
lib/maintenance/getSchoolMaintenanceRequests.ts
lib/notifications/dispatchModuleNotification.ts
lib/rbac/getSchoolRoles.ts (roles, role_permissions)
lib/reports/getCircularsReportData.ts (circulars, circular_targets, circular_responses)
lib/reports/getMaintenanceReportData.ts
lib/school/getPublicSchoolProfile.ts
lib/school/getSchoolDepartments.ts
lib/school/getSchoolLocations.ts
lib/school/getSchoolUsers.ts
lib/school/persistUserUpdates.ts
lib/school/resolveRoleForAssignment.ts
```

Small reference tables (roles, departments, locations) are low risk. The ones that grow are circulars, maintenance requests, calendar events, responses, attachments, updates, audit logs, notifications and users.

### A.3 Hard-coded English strings (M1)

```
achievements/AchievementDetailDialog.tsx:61            "Close"
achievements/AchievementDetailMetaGrid.tsx:41          "Recorded By"
achievements/AchievementFormFields.tsx:39              placeholder "e.g. 1st Place Robotics Competition"
achievements/CreateAchievementDialog.tsx:37            "Close"
auth/ForgotPasswordForm.tsx:45                         placeholder "user@example.com"
calendar/CalendarCoreFields.tsx:82                     placeholder "Auditorium / Hall A"
calendar/CalendarEventDetailContent.tsx:64             "View Full Event"
calendar/CalendarMonthView.tsx:70, 84                  "Previous month", "Next month"
circulars/CircularRemindModal.tsx:59                   "Close"
dashboard/DashboardComplianceDonut.tsx:32              aria-label "Department Compliance Donut Chart"
layout/AppShell.tsx:32                                 "Skip to main content"
layout/SchoolLogoAvatar.tsx:24                         alt "School logo"
maintenance/MaintenanceCoreFields.tsx:74               placeholder "AC-ROOM-102 / PUMP-01"
notifications/NotificationItem.tsx:56                  "Unread"
settings/AuditLogFiltersBar.tsx:22, 31, 40             three placeholders
settings/CreateDepartmentForm.tsx:45                   placeholder "e.g. Student Affairs"
settings/CreateLocationForm.tsx:53                     placeholder "room / lab / hall"
settings/CreateUserBasicFields.tsx:47                  placeholder "name@school.edu"
settings/SchoolContactFields.tsx:40                    placeholder "info@school.edu"
settings/SchoolLogoFields.tsx:42                       alt "Logo preview"
ui/AppMessageBox.tsx:48                                "Close"
ui/dialog.tsx:62                                       "Close"
```

(All paths are under `src/components/`. Example email and phone placeholders are lower priority than labels and alt text.)

### A.4 Foreign-key columns without an index (M2)

```
school_settings.school_id            profiles.invited_by
role_permissions.role_id             user_role_assignments.assigned_by
circulars.created_by                 circulars.closed_by
circular_targets.school_id           circular_responses.school_id
circular_responses.responder_id      circular_responses.revision_of
circular_attachments.school_id       circular_attachments.uploaded_by
school_sequences.school_id           maintenance_requests.location_id
maintenance_requests.closed_by       maintenance_assignments.school_id
maintenance_assignments.assigned_by  maintenance_updates.school_id
maintenance_updates.author_id        maintenance_attachments.school_id
maintenance_attachments.uploaded_by  calendar_events.created_by
notifications.school_id              audit_logs.actor_id
system_settings.updated_by           file_metadata.owner_id
school_achievements.created_by       backup_snapshots.school_id
backup_snapshots.created_by          school_documents.created_by
```

### A.5 Raw `<img>` (L1)

```
calendar/CalendarEventImageBanner.tsx:15      circulars/AttachmentPreviewModal.tsx:71
circulars/CircularAttachmentEmbeddedView.tsx:28   documents/SchoolDocumentPreviewDialog.tsx:135
layout/SchoolLogoAvatar.tsx:24                maintenance/MaintenanceAttachmentsList.tsx:37
public/PublicHero.tsx:50                      settings/SchoolLogoFields.tsx:42
```

### A.6 Backdrop `div onClick` (L3)

```
achievements/AchievementDetailDialog.tsx:46      achievements/CreateAchievementDialog.tsx:23
calendar/CalendarItemDetailDialog.tsx:36         circulars/CircularAttachmentEmbeddedView.tsx:23
layout/MobileNavDrawer.tsx:43                    pwa/IosInstallDialog.tsx:25, 32
settings/backup/RestoreConfirmDialog.tsx:34, 41
```

### A.7 Direct `console.*` (L4)

```
components/pwa/ServiceWorkerRegister.tsx:13, 17   components/theme/theme-provider.tsx:7, 8
lib/audit/recordCredentialAudit.ts:29             lib/audit/setAuditActor.ts:14
lib/backup/writeBackupAudit.ts:32                 lib/circulars/printAttachment.ts:25
lib/logger/logError.ts:13                         lib/logger/reportClientError.ts:27
lib/logger/reportError.ts:22                      lib/pwa/purgeClientCaches.ts:22
```

(The logger files themselves are the expected place for `console`; the others should use the logger.)

### A.8 Direct `process.env` reads (L6)

```
actions/auth/validateBootstrapGuard.ts:9,10,13    app/api/bypass/route.ts:7,22
components/pwa/ServiceWorkerRegister.tsx:12       components/settings/SchoolLogoFields.tsx:19
components/theme/theme-provider.tsx:6             lib/cron/assertCronAuthorized.ts:18,21
lib/documents/getPublicDocumentUrl.ts:3           lib/errors/sanitizeError.ts:30
lib/health/getBuildVersion.ts:11,12,13            lib/logger/buildErrorLogPayload.ts:12
lib/logger/logError.ts:12                         lib/logger/reportError.ts:21
lib/logger/reportErrorToSink.ts:12,15             lib/school/getSchoolLogoUrl.ts:3
```

---

## 8. Commands to verify after fixes

```
npm run verify            # lint, types, tests as defined in package.json
npm run test:rls          # row-level security battery (needs the local Supabase stack)
npm run build
node -e "console.log(require('cn'))"   # before H1, to see what the package exports
```
