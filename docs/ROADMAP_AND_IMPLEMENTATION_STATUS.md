# School Administration Portal: Roadmap & Implementation Status

> **Document Status:** Active & Maintained  
> **Last Updated:** October 2026  
> **Stack:** Next.js 16 (Turbopack, App Router), TypeScript (Strict), Supabase (PostgreSQL, Auth, Storage, RLS), Tailwind CSS, Vitest, Playwright.

---

## 1. Executive Summary

The School Administration Portal is an enterprise-grade, multi-tenant capable, Arabic-first (RTL) school operations system. The platform enforces strict separation of duties, zero-trust data access via PostgreSQL Row Level Security (RLS), architectural modularity (Rule #1: one function per file, ~300 line bound), and centralized error handling with real-time structured logging.

---

## 2. What We Did (Completed Implementations)

### A. Authentication, RBAC & Security Overhaul

1. **Platform Owner Shielding & Isolation:**
   - Platform Owner (`owner` role) accounts cannot be viewed, edited, created, or deleted by any school administrator or tenant manager.
   - Platform Owner is filtered out of tenant-level user management views (`/settings/users`) to prevent privilege escalation or accidental modification.
   - Added `assertCanManageUser.ts` server-side authorization barrier blocking modifications against platform owners.

2. **Strict Department Scoping & Role Attribution:**
   - Every Department Head and staff member is explicitly mapped to their respective department (`department_id`).
   - The user interface dynamically displays the active user's department name in header badges and user dropdowns.
   - Department Heads operate within departmental scope: they can view and submit responses only for circulars targeted to their department, role, or school-wide.

3. **Separation of Duties on Analytics & Reports:**
   - The `/reports` page and CSV export endpoints (`/api/reports/export`) are strictly restricted to the Platform Owner and School Managers (`school_admin`).
   - Revoked `reports.view` from `department_head` in both the live database and `supabase/migrations/0010_seed_rbac.sql`.
   - Updated `assertCanViewReports.ts` and `layout.tsx` navigation guards with defense-in-depth enforcement.

4. **Personalized User Home (`/dashboard`):**
   - The `/dashboard` serves as the personalized operational homepage for all authenticated roles.
   - Displays department affiliation, personalized active circulars with response status, pending maintenance tickets, school mission/vision, and role-appropriate quick actions.

5. **School Settings Persistence Fix:**
   - Resolved the RLS policy issue on the `schools` table where managers were prevented from updating school profile details.
   - Fixed multi-column payload mapping in `persistSchoolProfile.ts` and `updateSchoolAction.ts` ensuring immediate database persistence with audit logging.

---

### B. Unified Interactive Calendar & Personalized Circulars

1. **Full Visibility for All School Users:**
   - Every authenticated school user can access `/calendar` and view school-wide events, academic schedules, exams, and holidays.

2. **Seamless Merger of Events & Personalized Circulars:**
   - Created `buildUnifiedCalendarItems.ts` to merge `CalendarEventRow`s and active `CircularRow`s chronologically.
   - Governed by user-authenticated Supabase RLS (`is_circular_target(id)`): users automatically receive only circulars directed to their department, role, or whole school.
   - Circulars with submission deadlines (`due_at`), publication dates (`publish_at`), or creation timestamps render directly on the calendar alongside academic events.

3. **Full Interactive Details Dialog (`CalendarItemDetailDialog`):**
   - Clicking any event or circular in either Month Grid or List view opens an interactive detail modal:
     - **For Events:** Arabic and English titles, category badge, visibility badge (Public/Internal), status badge, exact start/end time and date, location, event creator, full description, and a direct link to the event's dedicated page.
     - **For Circulars:** Official reference number, priority badge, department target, formatted deadline countdown, required response type (acknowledgement/text), complete instructions/body excerpt, and a direct "View & Respond" link.

4. **Multi-Category & Circular Filtering:**
   - Interactive filter bar allows users to toggle between "All", specific event categories ("Academic", "Exam", "Holiday", "Meeting", "Event"), and "Circulars".
   - Supports both graphical Month Grid view and detailed List card view (`CalendarEventCard` and `CalendarCircularCard`).

---

### C. Core Operational Modules

1. **Administrative Circulars (`/circulars`):**
   - Circular creation with multiple department/role targets and file uploads (PDF, PNG, JPG).
   - Recipient tracking: School managers can view in real time who acknowledged/responded and who has not.
   - Response revision lock controls and direct print/download capabilities.

2. **Maintenance & Service Requests (`/maintenance`):**
   - State-machine workflow: `pending` -> `assigned` -> `in_progress` -> `completed` / `cancelled` / `reopened`.
   - Operator assignment, status transition reason logs, note threads, and photo upload verification.

3. **School Achievements & Milestones (`/achievements` - Owner Only):**
   - Standalone module located at `/[locale]/achievements`, completely isolated as a premium add-on feature.
   - Access is restricted exclusively to the Platform Owner (`roles.key === 'owner'`).
   - Completely hidden from the navigation sidebar, mobile drawers, dashboard quick actions, and dashboard statistics for all other roles (including School Managers/Admins).
   - Registration of academic, athletic, and cultural milestones with department attribution, date picker, photo uploads, and bilingual descriptions.
   - Real-time keyword, category, and department filtering.

4. **Executive Reports & Advanced Analytics (`/reports`):**
   - Segregated access strictly limited to Platform Owner and School Managers.
   - Multi-criteria filtering: dynamic date sorting (newest/oldest), temporal filters (all time, specific months, or custom date ranges), and department-level filtering across both Circulars Compliance and Maintenance & SLA tabs.
   - Formula-injection-safe CSV export with UTF-8 BOM encoding for Arabic spreadsheet compatibility.

5. **System Settings & Governance (`/settings`):**
   - Multi-tab management: School Profile, Locations, Departments, Users & Roles, and Immutable Audit Trail.
   - Clean, role-guarded server actions with `withActionErrorHandler` wrapper.

---

### D. Architectural Integrity & Quality Gates

- **Modularity Rule #1 Enforced:** Every single function, component, and validation schema resides in its own isolated file named after it, strictly capped at ~300 lines and max 80 lines per function.
- **Centralized Error Handling:** Typed `AppError` taxonomy with standardized error-code catalog, automatic database error mapping, and user-friendly bilingual toast feedback.
- **Zero Mock / Zero Fake Policy:** All implementations connect directly to PostgreSQL database tables, authenticated Supabase sessions, and live RLS policies.
- **Verification Suite:**
  - 206 Vitest test suites (651 unit and component tests passing, 0 failures).
  - ESLint with zero errors and zero warnings (Rule #1 single-export enforced).
  - Prettier formatting validated.
  - Strict TypeScript compiler (`tsc --noEmit`) passing with zero type issues.
  - Next.js production build (`next build`) generating all 54 static and dynamic routes cleanly.

---

### E. Code Quality & Security Inspection Remediation (October 2026)

All 20 issues identified in the Comprehensive Code Inspection (`School Admin Portal Code Inspection (Frontend + Backend).md`) were resolved and verified:

1. **Internal `cn` Implementation:** Replaced `cn` third-party import across 18 UI components with internal `clsx` + `twMerge` implementation (`src/lib/cn.ts`).
2. **Data Layer Chunking & In-Query Protection:** Added `chunkArray.ts` to batch array operations in chunks of 100, preventing URL length overflows in Supabase REST queries.
3. **Structured Error Handling:** Replaced query error swallowing with structured `logError` across profile, school, location, attachment, and reminder queries.
4. **Nonce-Based Content Security Policy:** Enforced CSP headers via Edge proxy `src/proxy.ts` and `next.config.mjs`.
5. **Hardened Maintenance Bypass:** Converted `/api/bypass` to POST with HMAC-SHA256 signed tokens and constant-time comparison.
6. **Authentication Route Throttling:** Added `checkAuthRateLimit.ts` protecting against credential stuffing and brute-force attempts.
7. **Complete UI Internationalization:** Eliminated all hard-coded English strings across AppShell, notifications, filters, achievements, and calendar.
8. **Foreign-Key Indexing:** Added migration `0056_add_missing_foreign_key_indexes.sql` indexing 31 foreign-key columns.
9. **School Documents Access Hardening:** Migration `0057_harden_school_documents_policies.sql` added `is_published` status and restricted anonymous access to published documents from active schools.
10. **Batch Attachment URLs:** Replaced sequential `createSignedUrl` loops with batch `createSignedUrls(paths, 3600)`.
11. **Exhaustive Audit Export:** Created `fetchAllSchoolAuditLogs.ts` with range-paginated loops and enforced `Cache-Control: no-store`.
12. **Authorized Deep Health Checks:** Protected `/api/health?deep=1` requiring Bearer secret or authenticated Platform Owner.
13. **Normalized Ignore Rules & Packaging:** Converted `.gitignore` to Unix LF and created `scripts/createArchive.mjs` (`npm run archive`).
14. **Migration Sequence Verification:** Verified all 57 migrations follow strict numerical ordering.
15. **Image Optimization:** Converted all raw `<img>` tags to `next/image` with responsive dimensions.
16. **Explicit Button Attributes:** Added `type="button"` to all interactive buttons.
17. **Standardized Modal Escape & A11y:** Applied `useDrawerEscape` with body scroll lock and `role="dialog"` + `aria-modal="true"` to all custom modals.
18. **Audit Logger Observability:** Replaced direct `console.*` calls with structured `logError` in audit modules.
19. **Type-Safe Query Filters:** Removed `any` in `applyAuditQueryFilters.ts` with `FilterableAuditQuery` interface.
20. **Client Environment Access:** Routed Supabase URL lookups through `getClientEnv()`.

---

## 3. What We Will Do (Upcoming Roadmap)

### Phase 4: Authentication & Onboarding Completion

- [ ] **Invitation & Magic Link Activation:**
  - Automated transactional email dispatch when an administrator creates a new staff account.
  - Secure activation tokens with time-limited expiration and initial password configuration.
- [x] **Self-Service Password Reset:**
  - Added "Forgot password?" link on [LoginForm.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/auth/LoginForm.tsx).
  - Created [forgot-password/page.tsx](<file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/app/[locale]/(auth)/forgot-password/page.tsx>) and [ForgotPasswordForm.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/auth/ForgotPasswordForm.tsx) invoking [requestPasswordResetAction.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/actions/auth/requestPasswordResetAction.ts).
  - Added PKCE auth callback route handler [src/app/api/auth/callback/route.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/app/api/auth/callback/route.ts) for secure code-to-session exchange.
  - Created [reset-password/page.tsx](<file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/app/[locale]/(auth)/reset-password/page.tsx>) and [ResetPasswordForm.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/auth/ResetPasswordForm.tsx) invoking [resetPasswordAction.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/actions/auth/resetPasswordAction.ts).
  - Full unit, route, and component tests in [requestPasswordResetAction.test.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/actions/auth/requestPasswordResetAction.test.ts), [resetPasswordAction.test.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/actions/auth/resetPasswordAction.test.ts), [route.test.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/app/api/auth/callback/route.test.ts), [ForgotPasswordForm.test.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/auth/ForgotPasswordForm.test.tsx), and [ResetPasswordForm.test.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/auth/ResetPasswordForm.test.tsx).
- [ ] **Session & Device Auditing:**
  - Profile page showing active user sessions and sign-in history.

### Phase 5: Advanced Calendar & Circular Automation

- [x] **Recurring Events Engine:**
  - Implemented pure date recurrence expansion helper [computeRecurringEventInstances.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/lib/calendar/computeRecurringEventInstances.ts) supporting `daily`, `weekly`, `biweekly`, and `monthly` frequencies with end-date and occurrence bounds.
  - Added batch series creator [createCalendarEventSeries.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/lib/calendar/createCalendarEventSeries.ts) inserting occurrence sets atomically into `calendar_events`.
  - Added [CalendarRecurrenceFields.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/calendar/CalendarRecurrenceFields.tsx) to [CreateCalendarEventForm.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/calendar/CreateCalendarEventForm.tsx).
  - Updated [parseCalendarFormData.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/lib/validation/parseCalendarFormData.ts) and [createCalendarEventAction.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/actions/calendar/createCalendarEventAction.ts).
  - Added complete unit and component test suites in [computeRecurringEventInstances.test.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/lib/calendar/computeRecurringEventInstances.test.ts), [createCalendarEventSeries.test.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/lib/calendar/createCalendarEventSeries.test.ts), [parseCalendarFormData.test.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/lib/validation/parseCalendarFormData.test.ts), and [CalendarRecurrenceFields.test.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/calendar/CalendarRecurrenceFields.test.tsx).
- [x] **Real-Time Push Notifications (WebSockets):**
  - Enabled Supabase Realtime publication on `public.notifications` table (`supabase/migrations/0039_enable_realtime_notifications.sql`).
  - Implemented [RealtimeNotificationListener.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/notifications/RealtimeNotificationListener.tsx) listening for live `postgres_changes` on the authenticated user's channel.
  - Dynamically triggers interactive bilingual Sonner toasts with direct deep-links to circulars, maintenance tickets, and calendar events.
  - Automatically invokes `router.refresh()` to update unread badge counts in [NotificationBell.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/notifications/NotificationBell.tsx) and refresh notification lists live without page reloads.
  - Verified with comprehensive unit tests in [RealtimeNotificationListener.test.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/notifications/RealtimeNotificationListener.test.tsx).
- [ ] **Department Head Delegation & Deputy Sign-Off:**
  - Allow Department Heads to designate acting deputies during leave periods with scoped permission grants.

### Phase 6: Enterprise Reporting & Analytics Enhancements

- [ ] **Advanced Compliance Analytics:**
  - Trend charts illustrating departmental compliance over time.
  - Automated PDF report generator for official ministry submissions and school board audits.
- [ ] **Service Level Agreement (SLA) Tracking for Maintenance:**
  - Automatic escalation alerts for critical maintenance tickets exceeding resolution windows.

### Phase 7: Deployment & Hosting Checklist (Vercel Production)

- [ ] **Vercel Environment Setup & Supabase Keepalive Activation:**
  - Add production environment variables in the Vercel Project Dashboard (**Settings > Environment Variables**); see `.env.example` for the annotated list:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `APP_URL`
    - `SCHOOL_TIMEZONE`
    - `CRON_SECRET` (**required** — without it `/api/keepalive` fails closed with 503)
    - `PLATFORM_BOOTSTRAP_SECRET` / `PLATFORM_OWNER_EMAIL` (to claim the first owner)
  - Vercel automatically deploys [vercel.json](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/vercel.json) crons, which will trigger `/api/keepalive` every 3 days at 06:00 UTC to prevent Supabase free tier inactivity pausing. Vercel sends the `CRON_SECRET` bearer automatically.
  - Point the uptime monitor at `GET /api/health?deep=1` (200 healthy, 503 database unreachable).
  - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to **GitHub Repository Secrets** if GitHub Actions scheduled workflow backup is also desired.

### Phase 8: Deferred Backend Feature Exposure (To Do Later)

- [x] **1. Implement "Edit Calendar Event" UI:**
  - Connected the backend action [updateCalendarEventAction.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/actions/calendar/updateCalendarEventAction.ts) to the frontend.
  - Added the dedicated route [calendar/[id]/edit/page.tsx](<file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/app/[locale]/(app)/calendar/[id]/edit/page.tsx>) and [EditCalendarEventForm.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/calendar/EditCalendarEventForm.tsx), accessible to users with `calendar.manage` permission or platform owner.
  - Added [formatDateTimeInput.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/lib/calendar/formatDateTimeInput.ts) for ISO to `datetime-local` input pre-population.
  - Exposed an edit action button in [CalendarActionButtons.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/calendar/CalendarActionButtons.tsx) on the event details page.
- [x] **2. Expand `/settings/school` with Workweek & Policy Settings:**
  - Connected existing backend columns from `school_settings` (`working_days`, `date_format`) to the UI.
  - Created [SchoolOperationFields.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/settings/SchoolOperationFields.tsx) featuring interactive checkboxes for the working week (Sunday–Saturday with Sunday–Thursday default for Kuwait/Gulf academic operations) and date format selection (`YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`).
  - Updated [parseSchoolFormData.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/lib/validation/parseSchoolFormData.ts), [persistSchoolProfile.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/lib/school/persistSchoolProfile.ts), [mergeSchoolSettings.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/lib/school/mergeSchoolSettings.ts), and [getSchoolFullDetails.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/lib/school/getSchoolFullDetails.ts).
  - Added unit and component tests in [mergeSchoolSettings.test.ts](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/lib/school/mergeSchoolSettings.test.ts) and [SchoolOperationFields.test.tsx](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/src/components/settings/SchoolOperationFields.test.tsx).

---

## 4. Verification & Testing Matrix

| Suite               | Target                           | Status      | Passing                      |
| ------------------- | -------------------------------- | ----------- | ---------------------------- |
| RLS Battery         | Supabase Auth & RLS Harness      | **PASSING** | 85 / 85 checks passed        |
| Unit & Integration  | Vitest                           | **PASSING** | 651 / 651 tests (206 suites) |
| Linter & Modularity | ESLint + D11 Single-Export       | **PASSING** | 0 errors, 0 warnings         |
| Code Formatting     | Prettier                         | **PASSING** | 100% compliant               |
| Type Safety         | TypeScript (`tsc --noEmit`)      | **PASSING** | 0 errors                     |
| Production Build    | Next.js Turbopack (`next build`) | **PASSING** | 54 routes compiled cleanly   |

---

_For architectural decisions and locked defaults, refer to [docs/decisions.md](./docs/decisions.md)._
