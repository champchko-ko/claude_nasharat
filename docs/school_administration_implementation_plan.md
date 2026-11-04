# School Administration Portal: Implementation Plan

## 1. Goal and Scope

Build a responsive web application for one school, with a clear path to
multi-school support if required. Support Arabic RTL and English-ready
architecture, mobile and desktop browsers, accessible forms, and
printable records.

Core modules: 1. Administrative circulars and assignments. 2.
Maintenance and service requests. 3. School calendar and public-facing
school information. 4. School settings and application-owner settings. 5. Full role-based access control (RBAC), audit history, notifications,
reporting, and tests.

## 2. Recommended Free-Tier Stack

Use one primary platform where possible to reduce complexity.

- **Frontend and hosting:** Next.js App Router, TypeScript, Tailwind
  CSS, deployed to Vercel Hobby.
- **Database, authentication, file storage, row-level security:**
  Supabase Free, PostgreSQL, Supabase Auth, Supabase Storage.
- **Validation:** Zod on the server and client.
- **Forms:** React Hook Form.
- **Testing:** Vitest, React Testing Library, Playwright, and Supabase
  local development/SQL tests where practical.
- **Code quality:** ESLint, Prettier, TypeScript strict mode.
- **Optional email:** start with in-app notifications. Add a free-tier
  email provider only after checking current limits and school email
  policies.
- **Optional image CDN:** do not add Cloudinary initially. Supabase
  Storage is sufficient for request photos and circular attachments.
  Add a separate provider only if measured needs justify it.

Free plans have quotas, restrictions, and possible inactivity pauses.
They are not a promise of unlimited free production service. Confirm
current terms before launch, monitor usage, and keep database backups
and an export plan. Do not depend on Vercel filesystem storage for
persistent uploads.

## 3. Architecture and Engineering Rules

- Use a modular Next.js application with server components by default
  and client components only for interactive UI.
- Put authorization and data mutations in server-side actions or route
  handlers. Never rely on hidden buttons or client-side checks for
  security.
- Use Supabase PostgreSQL as the source of truth. Enable Row Level
  Security (RLS) on every table exposed to the client.
- Keep the Supabase service-role key server-only. Never prefix it with
  `NEXT_PUBLIC_`.
- Validate all inputs with Zod on the server. Enforce file size, MIME
  type, and image limits.
- Use database migrations committed to Git. Never make undocumented
  production schema changes.
- Store all dates as timezone-aware timestamps where relevant.
  Configure the school timezone in settings.
- Maintain an audit log for sensitive actions, including actor,
  action, target, timestamp, and safe metadata. Do not log passwords,
  tokens, or unnecessary personal data.
- Use soft deletion or archival for operational records where history
  must be retained.
- Make status changes transactional and prevent duplicate submissions
  with server-side checks.
- Keep secrets in environment variables. Commit only `.env.example`
  with placeholder values.
- Create separate development, test, and production environments.
  Never run destructive tests against production.

## 4. Roles and RBAC

Implement permissions as data, not scattered role-name checks.

### Initial roles

- **Application Owner:** manages platform-wide configuration, creates
  or disables school tenants if multi-school mode is enabled, assigns
  school administrators, and reviews platform-level audit events.
  Cannot be viewed, edited, created, or deleted by any school administrator
  or tenant account. Filtered out of tenant-level user management views.
- **School Administrator / Principal:** manages school profile, staff
  accounts, departments, circulars, assignments, maintenance workflow,
  calendar, reports, and school-level settings.
- **Department Head:** mapped strictly to their respective department,
  sees and responds only to circulars targeted to their department,
  submits acknowledgements or responses, tracks departmental tasks,
  and manages permitted department maintenance records. Does NOT have
  access to executive `/reports` (access revoked to preserve separation of duties).
- **Staff Member:** views relevant published circulars and calendar
  entries, submits maintenance requests, and tracks their own
  requests.
- **Maintenance / Service Operator:** sees assigned service requests,
  updates progress and completion details, and accesses only the data
  needed to fulfil requests.
- **Read-only Auditor (optional):** reads authorized records and audit
  history without editing.

Use a permission matrix covering actions such as `circular.create`,
`circular.publish`, `circular.assign`, `circular.respond`,
`circular.view_responses`, `maintenance.create`, `maintenance.assign`,
`maintenance.update`, `maintenance.close`, `calendar.manage`,
`settings.school.update`, `users.manage`, `roles.manage`,
`reports.view` (restricted to Owner and School Admin), and `audit.view`.

Requirements: - Deny by default. - Check permissions on every
server-side read and write. - Enforce school and department scope in RLS
policies and server queries. - Prevent users from granting themselves
roles or permissions. - Shield Platform Owner accounts from tenant-level
discovery or modification. - Only the Application Owner may manage
platform-wide settings. School administrators may manage only their own
school settings and permitted school roles. - Protect the last active
owner/admin account from accidental removal. - Test direct API calls,
guessed record IDs, cross-school access, and cross-department access.

## 5. Functional Requirements

### 5.1 Circulars and Administrative Assignments

Fields: - Title, reference number, body, category, attachments, creator,
publish date, due date, priority, status. - Target departments and,
where needed, specific role groups. - Required response type:
acknowledgement, approval/rejection, or task completion. - Optional
response instructions and escalation policy.

Workflow: 1. Authorized administrator creates a draft. 2. Validate
target departments, due date, and response requirements. 3. Preview and
publish. Create one recipient task per target department or eligible
role. 4. Notify recipients in-app. 5. Department head opens the circular
and submits one of the permitted responses: "Acknowledged", "Approve",
or "Reject with reason". Use only the response types configured for the
circular. 6. Record response timestamp, status, and reason. Require a
reason for rejection. 7. Show administrators a response dashboard
grouped by department and job title, not by individual name, for routine
monitoring. 8. Show overdue and incomplete responses. Send reminders
according to configurable rules. 9. Allow authorized administrators to
close, archive, or formally amend a circular. Preserve the original
version and response history.

Privacy rule: - Routine response dashboards must show department and job
title only, not respondent names. - Keep the identity of the respondent
in a restricted audit record only if operational accountability or
applicable policy requires it. Access must be limited and audited. -
Explain to users what is hidden and what administrators can still
access. Do not promise anonymity if identity is retained. - Prevent
duplicate responses unless the circular allows revisions. Preserve prior
responses when revisions are allowed.

Suggested statuses: `draft`, `published`, `in_progress`, `completed`,
`overdue`, `archived`, `cancelled`. Response statuses should be
separate: `pending`, `acknowledged`, `approved`, `rejected`,
`completed`, `not_applicable`.

### 5.2 Maintenance and Service Requests

Fields: - Ticket number, title, description, category,
building/area/room, optional asset reference, photo attachments,
reporter, created time. - Priority: `emergency`, `urgent`, `medium`,
`deferrable`. - Status: `submitted`, `triaged`, `assigned`,
`in_progress`, `waiting_for_parts`, `resolved`, `closed`, `reopened`,
`rejected`. - Assigned operator/team, target response time, target
resolution time, work notes, resolution details, completion evidence,
timestamps.

Workflow: 1. Staff member submits the problem, location, description,
and optional photo. 2. Server validates fields and uploaded files.
Generate a ticket number. 3. Notify the authorized
administration/service team. 4. Administrator reviews priority,
categorizes, assigns an operator, and records any priority change with a
reason. 5. Operator updates status and adds work notes. 6. On
resolution, require resolution details and optionally completion photos. 7. Reporter or authorized administrator confirms closure, or reopens the
request with a reason. 8. Dashboard reports totals by priority,
location, category, status, age, and completion time. 9. Escalate
emergency and overdue requests according to configurable thresholds.

Priority definitions and service-level targets must be editable in
Settings. Default values are examples only and must be approved by the
school.

### 5.3 School Calendar, Personalized Deadlines, and School Achievements

Calendar entry types: - Holidays and official breaks. - Important dates
and academic deadlines. - School events and activities. - Personalized
circular deadlines and assignments. - School achievements and announcements.

Each calendar event includes title (Arabic & English), description, start/end date, all-day flag,
category, visibility (public/internal), location, attachments or image, creator,
and publication status.

Requirements:

- **Universal Viewing:** All authenticated school users can view school events on the calendar.
- **Personalized Circular Integration:** Active circulars targeted to the authenticated user's department, role, or school-wide are dynamically merged (`buildUnifiedCalendarItems`) with calendar events.
- **Interactive Full-Detail Dialog:** Clicking any item on the calendar opens an interactive modal dialog (`CalendarItemDetailDialog`):
  - _Public/Internal Events:_ Arabic & English titles, category badge, visibility badge, status badge, date, time, location, organizer name, description, and link to full event page.
  - _Personalized Circulars:_ Reference number, priority badge, department target, deadline countdown, required response type (acknowledgement/text), instructions/body excerpt, and direct "View & Respond" link.
- **School Achievements Registry:** Dedicated tab under `/calendar` allowing department heads and school managers to register departmental milestones, certifications, and awards with public/internal visibility and rich media.
- **Month Grid & Card List Views:** Full responsive layouts with category and circular filtering buttons.

### 5.4 Settings

Create a settings area with separate sections and permission checks.

**School profile** - Official name in Arabic and English, logo, school
type, educational stage, address, phone, email, website, timezone,
academic year, working days, and public description. - Vision, mission,
objectives, and approved public content.

**Departments and locations** - Department names, active status,
department heads, buildings, floors, rooms, service locations, and asset
categories.

**Circular policy** - Default due-date rules, response options, reminder
intervals, escalation rules, attachment limits, allowed file types, and
archival rules.

**Maintenance policy** - Priority labels, definitions,
response/resolution targets, categories, locations, assignment groups,
escalation thresholds, closure rules, and required completion evidence.

**Calendar policy** - Event categories, public/private defaults,
publishing permissions, and school-calendar display preferences.

**Users and access** - Invitations, activation/deactivation, department
assignment, role assignment, permission review, and session/security
policy.

**Notifications** - In-app notification preferences, reminder schedule,
and future email-provider configuration.

**Application owner settings** - Tenant/school provisioning if
multi-school mode is enabled, platform-wide defaults, system status,
quota monitoring links, and platform-level audit access. - Keep
platform-wide settings separate from school settings. - School
administrators must not edit owner-level configuration.

**System and retention** - School timezone, date format, language,
retention/archive rules, file size limits, maintenance mode policy, and
data export options.

All configurable values must be validated, permission-protected,
audited, and stored in the database. Avoid hard-coded policy values.
Include sensible initial defaults and an explicit "restore defaults"
confirmation where appropriate.

## 6. Suggested Database Model

Use UUID primary keys, foreign keys, indexes, created/updated
timestamps, and `school_id` on all school-scoped records.

- `schools`
- `school_settings`
- `profiles` linked to Supabase Auth users
- `departments`
- `locations`
- `roles`
- `permissions`
- `role_permissions`
- `user_role_assignments` with school and optional department scope
- `circulars`
- `circular_targets`
- `circular_responses`
- `circular_attachments`
- `maintenance_requests`
- `maintenance_assignments`
- `maintenance_updates`
- `maintenance_attachments`
- `calendar_events`
- `notifications`
- `audit_logs`
- `system_settings` for owner-only configuration
- `file_metadata` if needed for ownership and retention tracking

Use database constraints for valid status values, required rejection
reasons, unique ticket/reference numbers per school, and valid date
ranges. Store response identity separately from the anonymized/grouped
reporting projection. Do not rely on frontend filtering to hide names.

If the project is strictly single-school, retain school-scoped tables
and RLS where practical. This reduces future migration work if multiple
schools are later needed.

## 7. File Upload and Privacy

- Use private Supabase Storage buckets for circular attachments and
  maintenance photos.
- Use signed URLs with short expiry for private files.
- Use a separate public bucket only for approved public assets such as
  the school logo and published public-event images.
- Verify authorization before creating signed URLs.
- Validate actual file type, size, and image dimensions on the server.
  Do not trust filename extensions or browser MIME values alone.
- Generate safe storage paths. Prevent path traversal and overwriting
  other users' files.
- Consider image re-encoding and metadata stripping before storage.
- Test that unauthenticated users and unrelated departments cannot
  access private files.
- Define retention and deletion rules with school management before
  launch.

## 8. Notifications and Reporting

Start with in-app notifications and an unread counter. Add email only
after selecting a provider and verifying current free-tier limits.

Notify users about: - New circular assigned to their department. -
Due-date reminders and overdue tasks. - Rejection or a response
requiring follow-up. - New maintenance request, assignment, status
update, or resolution. - Published calendar events.

Prevent notification floods through configurable throttling,
deduplication, and digest options. Never treat a notification as the
source of truth. The database record is authoritative.

Reports: - Circular completion by department and deadline. - Pending,
rejected, overdue, and completed responses. - Maintenance counts by
priority, location, category, and status. - Average time to first
response and resolution. - Reopened and overdue requests. - Calendar
events by type and period. - Export authorized reports to CSV. Add real
server-generated PDF only if required, with Arabic RTL text shaping and
embedded fonts. Never create a report PDF from a screenshot.

## 9. Phased Implementation Plan

### Phase 0: Requirements and UX

- Confirm whether the application serves one school or multiple
  schools.
- Agree on role/permission matrix, response privacy, workflow
  statuses, retention rules, and public calendar fields.
- Create user journeys, page map, wireframes, and acceptance criteria.
- Define Arabic RTL layout, accessible labels, empty states, loading
  states, error states, and responsive breakpoints.

**Exit gate:** school management approves workflows and permission
matrix.

### Phase 1: Repository and Environment

- Create the Next.js TypeScript project with strict mode.
- Configure linting, formatting, environment validation, test
  commands, and CI.
- Create separate Supabase development and production projects where
  free-tier limits permit.
- Configure Vercel preview deployments and production environment
  variables.
- Add `.env.example`, setup instructions, and secret-handling rules.

**Tests:** clean install, typecheck, lint, production build,
missing-environment failure, and secret scan.

### Phase 2: Database, Authentication, RLS, and RBAC

- Create versioned SQL migrations for core tables, indexes,
  constraints, and storage buckets.
- Implement sign-in, sign-out, session handling, password reset or
  approved school sign-in method, account activation, and
  deactivation.
- Implement roles, permissions, department scope, and school scope.
- Write RLS policies before building business modules.
- Create a safe initial-owner bootstrap procedure that does not expose
  service credentials to the browser.
- Seed test users and departments in the test environment only.

**Tests:** unauthenticated denial, each role's allowed/denied actions,
cross-school isolation, cross-department isolation, direct API requests,
IDOR/guessed IDs, disabled users, role escalation, and storage access.
Do not proceed until critical authorization tests pass.

### Phase 3: Shared UI and Settings

- Build navigation, dashboard shell, forms, tables, filters,
  pagination, dialogs, toasts, and error handling.
- Build school profile, departments, locations, users, roles,
  permission assignments, and policy settings.
- Record sensitive settings changes in the audit log.
- Add server-side validation and confirm destructive actions.

**Tests:** form validation, unauthorized settings edits, role changes,
audit entries, RTL, keyboard navigation, and mobile layout.

### Phase 4: Circulars and Assignments

- Build draft creation, attachments, department targeting, preview,
  publication, response workflow, due dates, reminders, dashboards,
  and archive.
- Implement anonymized/grouped response views and restricted identity
  access where approved.
- Preserve response history and audit important transitions.

**Tests:** publish to correct recipients, no delivery to unrelated
departments, required rejection reason, duplicate response prevention,
overdue calculation, deadline/timezone boundaries, privacy leakage,
attachment authorization, and concurrent response submissions.

### Phase 5: Maintenance and Services

- Build request submission, location selection, photo upload,
  priority, assignment, work history, resolution, closure, and
  reopening.
- Add administration queue, filters, status history, and summary
  reports.
- Implement configurable escalation and response/resolution targets.

**Tests:** valid and invalid uploads, unauthorized ticket access,
priority change audit, legal status transitions, duplicate submission,
emergency escalation, closure requirements, reopen flow, and accurate
dashboard counts.

### Phase 6: Calendar and Public School Pages

- Build calendar CRUD, categories, public/private visibility,
  publication workflow, school overview, vision, mission, objectives,
  and achievements.
- Separate public queries from internal authenticated queries.
- Add accessible calendar list view as an alternative to a visual
  month grid.

**Tests:** public/private boundary, draft visibility, timezone and
all-day events, date-range validation, cancellation, mobile calendar
usability, and public-page data leakage.

### Phase 7: Notifications, Reports, and Export

- Add in-app notifications, read/unread state, reminders, throttling,
  and notification preferences.
- Build filtered reports and CSV export with server-side
  authorization.
- Add server-generated PDF only if required, using a library that
  supports real text and Arabic RTL shaping.

**Tests:** correct recipients, deduplication, reminder scheduling,
export permissions, CSV formula injection, Arabic text integrity, date
filters, large report pagination, and totals matching database queries.

### Phase 8: Hardening and Acceptance

- Run full regression, security, accessibility, performance,
  backup/restore, and deployment tests.
- Review Supabase RLS and Storage policies independently.
- Add monitoring for application errors and database/storage quota
  usage.
- Prepare admin guide, user guide, incident process, backup/export
  procedure, and rollback steps.
- Pilot with a small staff group and fix issues before full rollout.

**Exit gate:** all release-blocking tests pass, critical/high security
findings are resolved, backups are verified, and the school signs off on
acceptance criteria.

## 10. Required Test Strategy

### Automated layers

- **Unit tests:** permission evaluation, validators, status transition
  rules, due dates, timezone boundaries, priority/SLA calculations,
  and report aggregation.
- **Component tests:** forms, validation messages, role-dependent
  controls, loading/empty/error states, and RTL layout behavior.
- **Integration tests:** server actions, database constraints, RLS,
  storage authorization, audit logs, and notification generation.
- **End-to-end tests:** complete user journeys for each role using
  Playwright.
- **Security tests:** IDOR, privilege escalation, CSRF protections
  where relevant, XSS, SQL injection resistance through parameterized
  APIs, file-upload abuse, rate limits, session expiry, and
  public/private data boundaries.
- **Accessibility tests:** keyboard-only flows, focus visibility, form
  labels, contrast, screen-reader semantics, and automated axe checks.
- **Performance tests:** large tables, filtered reports, upload
  limits, pagination, and representative concurrent usage.
- **Recovery tests:** restore a backup or export into a non-production
  environment and verify key records and file references.

### Minimum end-to-end scenarios

1.  Administrator publishes a circular for Department A. Department B
    receives no access.
2.  Department head acknowledges, approves, and rejects with a required
    reason as applicable.
3.  Routine administration view shows department and job title without
    respondent names.
4.  Unauthorized staff member cannot view restricted respondent identity
    or private attachments.
5.  Staff member creates a maintenance request with a valid image.
    Administration assigns it and an operator resolves it.
6.  Invalid file, oversized file, unauthorized status change, and
    cross-department ticket access are rejected.
7.  Public visitors see only published public calendar events and
    approved school information.
8.  School administrator changes a policy value. The change is validated
    and audited.
9.  Application owner settings are inaccessible to school
    administrators.
10. User deactivation removes access, including active sessions
    according to the implemented session-revocation policy.
11. Reports and exports match database results and enforce the same
    permissions as the UI.
12. Migrations work from an empty database and from the previous schema
    version.

## 11. CI/CD and Release Gates

For every pull request: 1. Install dependencies from the lockfile. 2.
Run formatting check and lint. 3. Run TypeScript typecheck. 4. Run unit
and component tests. 5. Apply migrations to a disposable/test database. 6. Run database/RLS integration tests. 7. Run Playwright smoke tests
against a preview environment where practical. 8. Build the production
application. 9. Scan dependencies and secrets.

Before production migration: - Confirm a recent recoverable
backup/export. - Review migration SQL for destructive operations and
table locks. - Test migration on a copy of the current schema and
representative data. - Prefer additive, backward-compatible migrations.
For breaking changes, use expand-migrate-contract steps. - Never reset
or drop production data to resolve a migration error. - Document
rollback or forward-fix procedure. - Obtain explicit approval for
destructive migrations.

## 12. Definition of Done

A feature is complete only when: - Requirements and acceptance criteria
are met. - Server-side permission checks and RLS policies are tested. -
Loading, empty, success, validation, and failure states exist. - Audit
history is recorded where required. - Responsive Arabic RTL UI works on
phone and desktop. - Automated tests pass and no unresolved
critical/high security issue remains. - Database migrations and
environment changes are documented. - Relevant user/admin documentation
is updated. - Production deployment and recovery steps are verified.

## 13. Delivery Order

Prioritize in this order: 1. Requirements and permission matrix. 2.
Database, authentication, RLS, and RBAC. 3. Settings and
staff/department management. 4. Circulars and response privacy. 5.
Maintenance workflow. 6. Calendar and public school information. 7.
Notifications, reports, and exports. 8. Security hardening, pilot, and
production release.

Do not begin feature modules until authorization boundaries and database
ownership rules are tested. This is the main control against expensive
rework.
