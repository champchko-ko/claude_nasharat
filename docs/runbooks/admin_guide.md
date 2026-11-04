# Administrator Runbook & Operations Guide

## 1. Initial System Bootstrap & Account Provisioning

1. **Initial Platform Owner Bootstrap**:
   - The first user who signs up or is created in Supabase claims the `platform_owner` role from the Dashboard `/dashboard`.
   - The platform owner creates the School record and designates the primary **School Administrator**.
2. **Staff Invitation & User Management** (`/settings/users`):
   - School Administrators create staff accounts directly in the portal.
   - Staff cannot self-register; credentials or invitations are issued securely by administration.
   - Roles are assigned per user: `school_admin`, `dept_head`, `staff`, `maintenance_operator`, or `auditor`.
   - To revoke access, toggle the user to **Deactivated** (`is_active = false`). Active sessions are blocked immediately by the session refresh middleware.

## 2. Departmental Structure & Facilities Setup

1. **Departments** (`/settings/departments`):
   - Create academic and administrative departments (e.g. Science, Mathematics, English, Administration, Maintenance).
   - Assign a designated **Department Head** (`head_profile_id`). Department Heads receive circular tasks and departmental reports.
2. **Locations & Facilities** (`/settings/locations`):
   - Set up buildings, floors, and rooms (classrooms, labs, auditoriums, outdoor facilities).
   - These locations populate the location picker for maintenance tickets and campus events.

## 3. Circulars & Compliance Monitoring

1. **Issuing Circulars** (`/circulars/new`):
   - Provide reference number (or auto-sequence `CIR-YYYY-NNNN`), title, description, priority, category, and due date.
   - Select required response type:
     - `acknowledgement`: confirms receipt by the department head.
     - `approval`: requires formal approval or rejection with mandatory rationale.
     - `task`: departmental task completion.
   - Target specific departments or broadcast school-wide.
2. **Tracking Department Compliance** (`/circulars/[id]` & `/reports`):
   - Grouped compliance dashboard displays which departments have responded and which are pending.
   - Overdue circulars are flagged automatically for administrative follow-up.
   - Anonymized responses preserve staff privacy while providing department-level compliance metrics.

## 4. Maintenance & Facilities Operations

1. **Ticket Triage & Operator Assignment** (`/maintenance`):
   - Routine tickets (`submitted`) are triaged by the dispatcher or school administrator.
   - Administrators assign tickets to operators (`assigned`) with priority levels (`emergency`, `urgent`, `medium`, `deferrable`).
2. **Operator Work & Status Transitions**:
   - Operators transition assigned tickets through legal states: `in_progress`, `waiting_for_parts`, `resolved`.
   - Resolution photo evidence can be attached upon ticket completion.
3. **Closing & Reopening Tickets**:
   - Resolved tickets are reviewed by administration and marked `closed`.
   - If an issue recurs, administration can reopen the ticket (`reopened`) with a mandatory explanation.

4. **School Calendar & Academic Events**

5. **Internal vs. Public Events** (`/calendar/new`):
   - **Internal**: Visible only to authenticated school staff (faculty meetings, internal exam schedules).
   - **Public**: Automatically showcased on the public landing page `/` for parents, students, and community visitors.
6. **Event Management**:
   - Manage events across Month Grid and accessible List View.
   - Support for all-day events, specific timeframes, venues, and banner images.

## 6. School Achievements Module (`/achievements` - Owner Only)

1. **Platform Owner Add-on Feature**:
   - The **School Achievements** module is an isolated feature restricted exclusively to the **Platform Owner** (`owner` role).
   - Hidden from the sidebar, mobile drawers, dashboard widgets, and action lists for all other school roles (including School Managers).
2. **Registration & Showcase**:
   - Register awards, competition milestones, research excellence, and honours attributed to specific departments.
   - Interactive card view with search by Arabic/English keywords, category filter, and department filter.
   - Full mutation capabilities (create, update, delete) protected by owner-only server authorization barriers.

## 7. Reports & Data Exports

1. **Operational Analytics** (`/reports`):
   - **Circulars & Compliance**: Monitor total circulars, response rates, overdue items, and per-department breakdown.
   - **Maintenance SLA**: Inspect ticket volumes, status breakdowns, priority distributions, and average resolution times.
   - **Dynamic Sorting & Filtering**: Sort rows by creation date (newest or oldest first), filter by time frame (all time, specific month, or custom start/end dates), and filter by target department.
2. **Server-Authorized CSV Export**:
   - Click "Export CSV" to download verified datasets.
   - Files include formula injection protection (`'`, `=`, `+`, `-`, `@`) and UTF-8 BOM (`\uFEFF`) for Arabic spreadsheet fidelity.

## 8. Production Deployment & Automated Keepalive (Vercel)

1. **Deploying on Vercel**:
   - Link the GitHub repository to your Vercel project.
   - Configure required environment variables in **Project Settings > Environment Variables** (see `.env.example` for the full annotated list):
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `APP_URL` — the public origin; auth emails are built from it
     - `SCHOOL_TIMEZONE`
     - `CRON_SECRET` — **required in production**: without it `/api/keepalive` rejects every call instead of being public
     - `PLATFORM_BOOTSTRAP_SECRET` and/or `PLATFORM_OWNER_EMAIL` — required to claim the first owner in production
     - _(Optional)_ `ERROR_REPORTING_URL` / `ERROR_REPORTING_TOKEN` — forward structured errors to a collector
   - `vercel.json` needs no secret: Vercel sends `Authorization: Bearer $CRON_SECRET` to the cron automatically once the variable exists.
2. **Health check**:
   - `GET /api/health` → `200` with the running commit hash, without touching the database.
   - `GET /api/health?deep=1` → also runs one database query and returns `503` when it cannot reach it. Point the external uptime monitor at this URL.
3. **Automated 3-Day Supabase Keepalive**:
   - [vercel.json](file:///c:/Users/ahmed/Desktop/School_Administration_Portal/vercel.json) automatically registers the cron schedule to invoke `/api/keepalive` every 3 days at 06:00 UTC (`0 6 */3 * *`).
   - Keeps your Supabase PostgreSQL project active and prevents automatic 7-day free tier pausing.
   - Can also be backed up via GitHub Actions by pasting `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in GitHub Repository Secrets.
4. **Error visibility**:
   - Server crashes (render, route handler, Server Action, proxy) are reported by `src/instrumentation.ts` with a correlation id.
   - Browser crashes are reported by `src/instrumentation-client.ts` and by the error boundaries; the screen shows the reference code a user can quote.
   - With `ERROR_REPORTING_URL` unset, reports stay in the platform's structured log; set it to forward the same JSON payload to a collector.
