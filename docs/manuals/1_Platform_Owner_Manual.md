# User Manual: Platform Owner (Super Administrator)

> **Role Key:** `owner`  
> **Access Scope:** Multi-tenant platform level, platform settings, school provisioning, platform audit logs, and exclusive access to the School Achievements module.

---

## 1. Introduction & Overview

As the **Platform Owner**, you possess the highest level of administrative authority in the School Administration Portal. Your account is isolated from individual school administrators to prevent privilege escalation or accidental modification.

You are responsible for:

- Bootstrapping the application from an empty deployment.
- Initializing and provisioning School Tenants.
- Designating the primary School Administrator.
- Managing platform-level governance and security policies.
- Celebrating and curating institutional milestones in the exclusive **School Achievements** module.

---

## 2. Phase 1: Bootstrapping an Empty Application (Day 0)

When the application is first deployed to production (e.g., on Vercel with a new Supabase database), no school data or staff accounts exist.

### Step 1: Initial Account Registration

1. Navigate to the portal web address (e.g., `https://your-domain.com/login`).
2. If this is the initial launch, create your account using Supabase Auth or sign in using the deployment credentials configured in your environment.
3. Access the portal home at `/` or `/dashboard`.

### Step 2: Claiming Platform Ownership

The portal includes a self-service bootstrap mechanism for the very first platform user:

1. When signed in, look for the **Claim Platform Owner** banner on the dashboard or navigate to `/settings/system`.
2. Click **Claim Platform Owner**.
3. The system executes a secure atomic check: if no active Platform Owner exists in the system, your account is immediately granted the `owner` role.
4. Once claimed, this action is permanently locked in the database and cannot be claimed by any other user.

### Step 3: Verifying Platform Shielding

Once assigned the `owner` role:

- Your account is automatically shielded from all school-level administrator views.
- School Administrators cannot view, edit, reassign, or delete your account in `/settings/users`.
- You have unrestricted visibility across system health and audit logs.

---

## 3. Phase 2: Provisioning School Tenants & School Admins

### Step 1: Creating a New School Tenant

1. Navigate to **System Governance** or execute the initial school setup action.
2. Provide the essential details:
   - **School Arabic Name:** (e.g., `مدرسة الأمل النموذجية للبنين`)
   - **School English Name:** (e.g., `Al-Amal Model School for Boys`)
   - **Ministry / Registration Code:** Unique school identifier.
   - **Subdomain or Slug:** URL identifier.

### Step 2: Provisioning the First School Administrator

1. In the user management area, create the primary administrator account for the school:
   - **Full Name:** Principal or Lead Administrator (e.g., `أحمد المنصور`).
   - **Email:** The administrator's official school email address.
   - **Temporary Password:** A strong initial password (the user can reset this via Self-Service Password Reset).
   - **Assigned Role:** Select **School Administrator** (`school_admin`).
   - **School Link:** Link the user explicitly to the newly created school tenant.
2. Hand over the credentials securely to the School Administrator.

---

## 4. Phase 3: Managing the School Achievements Module

The **School Achievements** module is an exclusive, premium capability restricted solely to the Platform Owner (`roles.key === 'owner'`).

### What is the Achievements Module?

It allows the institution to document, celebrate, and archive outstanding academic, athletic, cultural, and scientific honors earned by students and departments.

### How to Register a New Achievement:

1. In the sidebar or top navigation, click on **School Achievements** (`/achievements`).
   > _Note: This link is completely hidden from all other user roles._
2. Click **Register Achievement** (`+ تسجيل إنجاز جديد`).
3. Fill out the achievement card:
   - **Achievement Title (Arabic):** e.g., `المركز الأول في أولمبياد الرياضيات الوطني`.
   - **Achievement Title (English):** e.g., `First Place in National Mathematics Olympiad`.
   - **Attributed Department:** Select the winning department (e.g., Mathematics).
   - **Category:** Academic, Athletic, Cultural, Community, or Innovation.
   - **Date Achieved:** Select the date the honor was awarded.
   - **Visibility Level:**
     - **Public:** Highlighted on the public school homepage for visitors and parents.
     - **Internal:** Archived for internal school records and faculty inspection.
   - **Description:** Provide context, student names, and competition details.
   - **Certificate / Banner Photo:** Upload an image of the award or certificate (JPG, PNG, WebP up to 10MB).
4. Click **Save Achievement**. The record is immediately published.

---

## 5. Security & System Audit Trail

### Inspecting Immutable Audit Logs (`/settings/audit`)

Every security-critical event in the platform is captured in an append-only PostgreSQL audit trail.
As Platform Owner, you can filter and inspect:

- User role assignments and privilege grants.
- Password resets and login activity.
- School setting alterations.
- Deleted circulars or overridden maintenance work orders.
- IP addresses, timestamps, and actor identifiers.

> [!TIP]
> **Best Practice:** Review the audit trail periodically at the end of each academic quarter to ensure zero unauthorized configuration changes.

---

## 6. Database Backup, Restore & Disaster Recovery (`/settings/backup`)

As Platform Owner, you have exclusive custody over tenant configuration export
and restore. Full disaster recovery is a separate procedure (see below).

### Key Capabilities & Privacy Guarantees

- **Exclusive Access:** Gated strictly to the `owner` role. Completely hidden from School Administrators, Department Heads, and Staff. The database function that performs a restore independently verifies the operator's owner assignment, so a crafted request cannot bypass the page.
- **Exporting a configuration file:** The JSON includes schools, settings, departments, locations, roles and permissions, profiles, role assignments, sequence counters, circulars (with targets and responses), maintenance requests (with assignments and updates), calendar events and achievements.
- **Owner Account Shielding:** Platform Owner profiles are excluded from the export, so owner identities are never leaked in a file or overwritten by a restore.
- **Not a disaster-recovery backup:** the JSON contains no passwords, no storage files (attachments, photos), no audit history and no notifications. Every export lists these exclusions in `metadata.exclusions`. For full recovery use Supabase backups/PITR or `supabase db dump` — see `docs/runbooks/backup_and_restore.md`.
- **Safe Restoration Workflow:**
  1. Navigate to **Settings > Database Backup** (`/settings/backup`).
  2. Upload a valid JSON backup file (maximum 10 MB).
  3. Review the manifest (export timestamp, scope, total records, checksum) and the **preview** — how many records are new, how many will be overwritten, and how many existing records will stay untouched.
  4. Confirm the operation. Restore runs in a single database transaction: if any table fails, nothing is written. A pre-restore snapshot is saved and its id is shown on success.
- **Restore is upsert-only:** it adds or updates records from the file and never deletes records that are missing from it. Returning to an earlier state requires restoring a database dump or a point-in-time backup.
- **Audited:** every export and restore attempt writes `database.export.*` / `database.restore.*` rows to the audit trail.
