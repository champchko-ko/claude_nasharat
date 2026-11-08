# School Administration Portal (بوابة الإدارة المدرسية)
kh
A modern, enterprise-grade school management platform built for modern educational institutions. Engineered with an Arabic-first Right-to-Left (RTL) experience with full English (LTR) localization, strict role-based access control (RBAC), real-time WebSockets notifications, comprehensive maintenance workflows, administrative circulars, recurring calendar events, executive reports, and an adaptive multi-theme design system.

---

## Application Framework & Tech Stack

| Layer                       | Technologies & Tools                                                                                                                         |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework & Runtime**     | [Next.js 16.4.2](https://nextjs.org/) (App Router, Turbopack, React 19 Server Components, Server Actions)                                    |
| **Language & Toolchain**    | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) · [Node.js 24+](https://nodejs.org/)                                           |
| **Database & Backend**      | [Supabase](https://supabase.com/) (PostgreSQL 15+, Row-Level Security / RLS policies, Storage buckets)                                       |
| **Real-Time Engine**        | [Supabase Realtime](https://supabase.com/docs/guides/realtime) (WebSockets push notifications on `public.notifications`)                     |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com/) · [@base-ui/react](https://base-ui.com/) primitives · [Lucide Icons](https://lucide.dev/)        |
| **Theming Engine**          | `next-themes` supporting 5 curated themes (Royal Navy [Default], Classic Light, Slate Dark, Emerald Academy, Midnight OLED)                  |
| **Internationalization**    | `next-intl` (Arabic `ar` RTL default + English `en` LTR) with locale prefix routing                                                          |
| **Validation & Security**   | [Zod 4](https://zod.dev/) type-safe schemas · Server-only guardrail modules · Strict RLS SQL isolation                                       |
| **Testing & Quality Gates** | [Vitest 5](https://vitest.dev/) (651 tests across 206 test suites) · [Playwright](https://playwright.dev/) · [ESLint 9](https://eslint.org/) |
| **Mobile & PWA**            | Progressive Web App manifest, Service Worker offline caching, install banner                                                                 |

---

## Live Application Modules

1. **Dashboard & Executive Pulse (لوحة التحكم):**
   - KPI metric stat cards: Completion Rate (%), Overdue Tasks, Active Maintenance Orders, and Open Circulars.
   - Interactive department response donut chart breakdown.
   - Priority maintenance feed with quick action dispatching.
   - Weekly calendar agenda strip.

2. **Administrative Circulars & Duties (التعاميم والتكليفات):**
   - Full lifecycle management: Draft → Published → In Progress → Completed → Overdue → Archived.
   - Targeted distribution by department or individual staff role.
   - Secure PDF/image attachment uploads, in-browser printing, and authenticated file downloads.
   - Real-time acknowledgment tracking and compliance auditing.

3. **Maintenance & Facilities Service Desk (طلبات الصيانة والمرافق):**
   - Structured work order ticketing with location tagging (Buildings, Floors, Classrooms, Labs).
   - Priority-based triage (Urgent, High, Medium, Low) and strict technician assignment (`operator` role).
   - Smart technician absence detection displaying a warning banner with direct shortcut to Users & Roles.
   - Photo attachment uploads and stage transition controls.

4. **Unified School Calendar & Recurrence Engine (الرزنامة المدرسية):**
   - Dual calendar support: Islamic Hijri and Gregorian dates.
   - Strict weekend scheduling policy: Friday & Saturday are designated as non-working holidays and prevented from selection across client and server.
   - Series recurrence engine supporting Daily, Weekly, Biweekly, and Monthly recurring events with automatic weekend skipping.
   - Visual weekend indicators and localized holiday headers (`الجمعة (عطلة)`, `السبت (عطلة)`).
   - Personalized circular deadlines automatically merged into teacher and administrator agendas.

5. **Real-Time Push Notifications (الإشعارات الفورية):**
   - Instant WebSocket delivery for circular publishing, maintenance assignments, and urgent escalations.
   - Live badge counter, audio chime alerts, and unread notification drawer.

6. **School Achievements & Institutional Honors (سجل الإنجازات):**
   - Platform Owner & Principal portfolio for national competition medals, student honors, and accreditation records.
   - Categorized repository with date, recipient, and evidence management.

7. **Reports & Compliance Analytics (التقارير والإحصاءات):**
   - Multi-criteria filtering by department, priority, date range, and operational status.
   - Real-time department compliance rate calculations and raw CSV document exports.

8. **School Settings, Security & RBAC (الإعدادات والصلاحيات):**
   - 6 hierarchical roles: Platform Owner, School Principal, Assistant Principal, Department Head, Teacher, Maintenance Technician.
   - Structured 6-sub-tab layout: School Identity, Leadership, Location & Contact, Academic Year, Vision & Mission, Operations.
   - Custom accessible confirmation modal (`AppMessageBox`) replacing all native browser confirm popups with responsive action handling.
   - Self-service password reset with cryptographic tokens.
   - Date display format configuration (ISO, Day/Month/Year, Day-Month-Year, Month/Day/Year).
   - Academic year, terms, and institutional metadata persistence.

9. **Database Backup & Disaster Recovery (النسخ الاحتياطي واستعادة البيانات):**
   - High-integrity JSON database snapshot export and validated restore interface (`/settings/backup`).
   - Platform Owner exclusivity: strictly hidden across navigation and settings from school administrators and staff.
   - Comprehensive multi-table schema validation powered by Zod with visual entity counts preview prior to commit.
   - Automatic security scrubbing: Platform Owner accounts and platform governance credentials are excluded from tenant backup exports.

---

## Getting Started

### Prerequisites

- Node.js 24+
- npm 10+
- Supabase account or local Supabase CLI

### Setup & Local Development

```powershell
# 1. Install dependencies
npm ci

# 2. Configure environment variables
Copy-Item .env.example .env.local

# 3. Start development server with Turbopack
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portal in Arabic (RTL), or navigate to [http://localhost:3000/en](http://localhost:3000/en) for English (LTR).

---

## Available Scripts

| Command             | Purpose                                                    |
| :------------------ | :--------------------------------------------------------- |
| `npm run dev`       | Launch local development server with Next.js Turbopack     |
| `npm run build`     | Compile and bundle production Next.js application          |
| `npm run start`     | Serve production application bundle                        |
| `npm run lint`      | Run ESLint enforcing strict Modularity Rule #1             |
| `npm run typecheck` | Run strict TypeScript validation (`tsc --noEmit`)          |
| `npm run test`      | Run all 88 Vitest test suites (253 tests)                  |
| `npm run test:e2e`  | Run end-to-end Playwright tests across browsers            |
| `npm run test:rls`  | Execute full Supabase RLS security harness & battery       |
| `npm run format`    | Format entire codebase using Prettier                      |
| `npm run verify`    | Full CI verification gate (lint + typecheck + test + scan) |

---

## Architectural Principles (Enforced by CI)

- **Rule #1 — One function per file, no big files:**
  Every function, React component, hook, and validation schema resides in its own dedicated file named after it. Files are bounded at ~300 lines, functions capped at 80 lines, and strictly one runtime export per file (`d11/single-export`).
- **Unified Theming System:**
  CSS tokens configured in `src/app/globals.css` with explicit contrast rules eliminating dark mode dropdown issues across all browsers and operating systems.
- **Fail-Fast Environment Validation:**
  Zero `process.env` leaks in client code. Validated strictly on server initialization via Zod schemas in `src/lib/env`.
- **Database Schema as Code:**
  All PostgreSQL schemas, functions, triggers, and RLS policies are versioned as ordered migrations under `supabase/migrations/`.

---

## Documentation & Manuals

- **Role-Based User Manuals:** Detailed operational walkthroughs for every staff role are available in [docs/manuals/USER_MANUAL_INDEX.md](./docs/manuals/USER_MANUAL_INDEX.md) and formatted DOCX export [USER_MANUAL_INDEX.docx](./docs/manuals/USER_MANUAL_INDEX.docx).
- **Interactive Human-Centric Prototypes:**
  - Standard Creative Prototype: [`public/prototype_creative_ux.html`](./public/prototype_creative_ux.html)
  - Artisanal Human Desk & Floating Dock Prototype: [`public/prototype_human_creative_v2.html`](./public/prototype_human_creative_v2.html)
# claude_nasharat
