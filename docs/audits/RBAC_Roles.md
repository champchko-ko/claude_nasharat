# RBAC Roles Report — School Administration Portal

**Status:** Draft v2 for review (hybrid role model chosen). Nothing in the repository has been changed.
**Date:** 2026-11-04
**Audience:** Developers and school administrators.
**Replaces:** the previous `docs/audits/RBAC_Roles.md` (a pasted review that described permissions and roles not present in the code).

**How to read this report.** Every statement is tagged:

- **[Verified]** read directly in a migration or source file (file named).
- **[Documented]** stated in the repo's manuals or decisions log; not re-checked against code.
- **[Proposed]** a recommendation for the redesign. Not implemented.
- **[Open]** needs your decision.

**Not done:** the app was not run, tests and the RLS battery were not executed, and UI files were not opened beyond grep.

---

## 1. Summary

1. The code has **five system roles**, not six: `owner`, `school_admin`, `department_head`, `staff`, `operator`. "Principal", "Assistant Principal" and "Deputy" are all the one `school_admin` role; "Teacher" is `staff`; "Maintenance Technician" is `operator`. [Verified: `0010_seed_rbac.sql`, `messages/en.json`; Documented: `USER_MANUAL_INDEX.md`]
2. Permissions are a **fixed catalog of 16 keys**, granted per role in `role_permissions`. Anything not granted is denied.
3. The effective matrix is very narrow for non-admin roles: `department_head` holds 2 permissions, `staff` 1, `operator` 1.
4. Enforcement is layered: **database (RLS + triggers) is the main layer**, server actions add owner checks, and the UI hides what the user cannot use.
5. Owner-only features (backup/restore, achievements, role management) are enforced by an `isPlatformOwner` check, not by a permission key.
6. Multi-tenancy (`school_id` on assignments, roles and policies) adds most of the complexity in the role system. Removing it simplifies roles considerably (section 8).

---

## 2. Role inventory

| Your list | Role key | Display name (EN) | Display name (AR) | Notes |
|---|---|---|---|---|
| Platform Owner | `owner` | System Administrator | مدير النظام | Hidden from non-owners by design (decision D23) |
| Principal | `school_admin` | School Administrator | مدير مدرسة | Also used for Assistant Principal / Deputy |
| Department Head | `department_head` | Department Head | رئيس قسم | Always tied to one department |
| Teacher | `staff` | Staff Member / Staff | موظف / كادر مدرسي | Manual calls it "Teacher / Academic Staff" |
| Maintenance Technician | `operator` | Maintenance Operator / Technician | فني صيانة | Only users with this role can be assigned tickets |
| **"Staff/operator"** | *(unclear)* | | | **[Open]** See question Q1: `staff` is the teacher role and `operator` is the technician, so this line looks like a duplicate. |

The `auditor` role was retired by migration `0059`, but references remain in code (section 6, finding F1).

The system also supports **custom school roles** (`is_system = false`, `school_id` set), created by the owner. [Verified: `0034`, `createRoleAction.ts`, `updateRoleAction.ts`]

---

## 3. Permission catalog (current)

16 keys, grouped as seeded in `0010_seed_rbac.sql` and mirrored in `src/lib/rbac/permissions.ts`:

| Category | Keys |
|---|---|
| circulars | `circular.create`, `circular.publish`, `circular.assign`, `circular.respond`, `circular.view_responses` |
| maintenance | `maintenance.create`, `maintenance.assign`, `maintenance.update`, `maintenance.close` |
| calendar | `calendar.manage` |
| settings | `settings.school.update`, `settings.platform.update` |
| administration | `users.manage`, `roles.manage` |
| reporting | `reports.view` |
| audit | `audit.view` |

There are no separate "view" permissions. Reading is controlled by RLS policies and by assignment/targeting, not by catalog keys.

---

## 4. Effective permission matrix (current)

Derived from `0010` (seed), `0060` (owner gets all 16) and `0061` (school_admin loses `roles.manage`). [Verified]

| Permission | owner | school_admin | department_head | staff | operator |
|---|:-:|:-:|:-:|:-:|:-:|
| circular.create | ✔ | ✔ | | | |
| circular.publish | ✔ | ✔ | | | |
| circular.assign | ✔ | ✔ | | | |
| circular.respond | ✔ | | ✔ | | |
| circular.view_responses | ✔ | ✔ | | | |
| maintenance.create | ✔ | ✔ | ✔ | ✔ | |
| maintenance.assign | ✔ | ✔ | | | |
| maintenance.update | ✔ | ✔ | | | ✔ |
| maintenance.close | ✔ | ✔ | | | |
| calendar.manage | ✔ | ✔ | | | |
| settings.school.update | ✔ | ✔ | | | |
| settings.platform.update | ✔ | | | | |
| users.manage | ✔ | ✔ | | | |
| roles.manage | ✔ | | | | |
| reports.view | ✔ | ✔ | | | |
| audit.view | ✔ | ✔ | | | |
| **Total** | **16** | **13** | **2** | **1** | **1** |

Caveat: `0060` and `0061` record the state the deployed project had reached by hand. A database built from the migrations should now match it. This was not tested.

---

## 5. Role profiles (current)

### 5.1 Platform Owner (`owner`)

- **Purpose:** system host and super administrator.
- **Assignment:** a platform-level assignment (`school_id` null). The first authenticated user can claim it once through `bootstrap_platform_owner`; later attempts are rejected. [Verified: `0010`, `0020`]
- **Permissions:** all 16.
- **Exclusive features:** database backup/restore (`/settings/backup`), School Achievements (`/achievements`), creating/renaming/re-permissioning/deleting roles. [Documented: `decisions.md` D12, D16, D22; Verified: role actions require `isPlatformOwner`]
- **Protections:** cannot be assigned by anyone else (`r.key <> 'owner' or is_platform_owner()` in `0040`); the last owner cannot be removed or demoted; users cannot edit their own assignments (`0020`). The owner is hidden from non-owner screens (D23).
- **Backups:** exports scrub owner accounts. [Documented: D22]

### 5.2 School Administrator / Principal (`school_admin`)

- **Purpose:** runs the school day to day: setup, users, circulars, maintenance triage, calendar, reports.
- **Permissions (13):** everything except `circular.respond`, `settings.platform.update` and `roles.manage`.
- **Can:** assign existing roles to users (`users.manage`), publish circulars, assign/close maintenance, manage the calendar, view compliance reports and audit.
- **Cannot:** manage roles, access backup/restore or achievements, or grant owner. [Verified: `0061`, `0040`]
- **Scope:** school-wide. In a single-school deployment this is the whole system.

### 5.3 Department Head (`department_head`)

- **Permissions (2):** `circular.respond`, `maintenance.create`.
- **Scope:** one department. A response is accepted only if the caller holds an assignment in that department and the department is targeted by the circular. [Verified: `0050`, `0049`]
- **Documented duties:** respond to circulars for the department, report repairs, follow the calendar.
- **Gap:** cannot see responses (`circular.view_responses`), so "department-only" visibility depends on RLS reads, which were not audited here (F3).

### 5.4 Teacher / Academic Staff (`staff`)

- **Permissions (1):** `maintenance.create`.
- **Documented duties:** view circulars and confirm acknowledgment, view the calendar, report classroom repairs with photos. [Documented: `4_Teacher_Staff_Manual.md`]
- **Gap:** the manual says teachers click "Confirm Acknowledgment", but the response insert policy and `submit_circular_response` both require `circular.respond`, which `staff` does not hold. Either acknowledgment uses another path I did not find, or the manual is ahead of the code (F2). **[Open]**

### 5.5 Maintenance Technician (`operator`)

- **Permissions (1):** `maintenance.update`.
- **Rules:** appears in the technician list only if active and holding `operator` (decision D19). Status updates are limited to assigned tickets, closing and rejecting need `canClose` / `canAssign`. [Verified: `assertTransitionRole.ts`]
- **Documented:** mobile work queue, work notes, photo proof.

---

## 6. Enforcement map (current)

| Layer | What it does | Where |
|---|---|---|
| Database function | `has_permission(key, school, department)` checks the caller's active assignments and role permissions; department-scoped assignments must match when a department is requested | `0026` |
| RLS policies | Row access per table, using `has_permission` and targeting helpers | `0011`, `0022`, `0040`, `0049` and later |
| Triggers | Last-owner/last-admin protection, no self-role-edit, no platform-level changes by non-owners | `0020`, `0040` |
| Server actions | Owner-only checks via `isPlatformOwner`; role and backup actions refuse non-owners | `src/actions/rbac/*`, `src/actions/backup/*` |
| App helpers | `hasPermission`, `getEffectivePermissions`, `resolveDashboardPermissions`, `getCircularPermissions` | `src/lib/rbac`, `src/lib/dashboard`, `src/lib/circulars` |
| UI | Hides navigation and widgets the user cannot use | Not reviewed (UI files untouched) |

### Findings

| # | Finding | Severity |
|---|---|---|
| F1 | Stale `auditor` references after `0059`: `assignUserRole.ts` (school-wide list) and `resolveRoleDisplayName.ts`, plus `roleAuditor` strings | Low |
| F2 | Teacher acknowledgment: manual says allowed, but `staff` lacks `circular.respond` (see 5.4) | **Medium, needs confirmation** |
| F3 | Department Head has no `circular.view_responses`; department visibility relies on RLS reads not reviewed here | Medium |
| F4 | `hasPermission` falls back to `effective_permission_keys` when the RPC returns false, giving two sources of truth | Low |
| F5 | `assignUserRole` has no owner check in app code; protection is entirely in database policy (`0040`). Acceptable, but worth a test per role | Low |
| F6 | Owner-only features use `isPlatformOwner`, not a permission key, so the permission catalog does not describe everything the owner alone can do | Low |
| F7 | `PERMISSION_KEYS` is a hand-kept mirror of the database catalog and can drift | Low |
| F8 | Comment in `0060` says `school_admin` `roles.manage` is "deliberately not encoded"; `0061` later removes it. History is correct but confusing | Info |
| F9 | README lists "Assistant Principal" and "Teacher" as roles; the code has no such keys | Info |

---

## 7. Proposed role model (single school, fixed roles)

**[Proposed, decided: hybrid]** Five locked system roles ship as defaults. The owner can edit the permissions of all five, and can create, edit and delete custom roles, with no code change. Deny by default, enforced in the database. Role keys stay as they are so existing UI code keeps working.

### 7.1 Roles

| Key | Display | Scope | Notes |
|---|---|---|---|
| `owner` | Platform Owner | Whole system | Exactly one or more owners; last owner protected; hidden from others |
| `school_admin` | Principal | Whole school | Assistant Principal / Deputy share this role unless you want them split (Q2) |
| `department_head` | Department Head | Own department | |
| `staff` | Teacher / Staff | Own records + targeted circulars | Optional split into Teacher and Administrative Staff (Q1) |
| `operator` | Maintenance Technician | Assigned tickets | |

Custom roles stay, but are no longer tied to a school. Role-to-permission grants live in the database and are edited by the owner through the existing role screens (section 7.5).

### 7.2 Proposed permission catalog

Split broad keys into explicit ones, and add the "view" and "scope" ideas the old review recommended. Existing keys keep their names; new keys are additions.

| Category | Keys |
|---|---|
| circulars | `circular.view`, `circular.create`, `circular.update`, `circular.delete`, `circular.publish`, `circular.assign`, `circular.respond`, `circular.view_responses` (all) and `circular.view_department_responses` |
| maintenance | `maintenance.view`, `maintenance.create`, `maintenance.assign`, `maintenance.update`, `maintenance.submit_completion`, `maintenance.close`, `maintenance.reopen`, `maintenance.reject` |
| calendar | `calendar.view`, `calendar.manage` |
| users | `users.view`, `users.create`, `users.update`, `users.deactivate`, `users.assign_role`, `users.reset_password` |
| roles | `roles.view` (owner-only changes, since roles are fixed) |
| reports | `reports.view`, `reports.export` |
| audit | `audit.view` |
| settings | `settings.school.update`, `settings.platform.update` |
| owner-only | `backup.export`, `backup.restore`, `achievements.manage` (made real keys instead of ad hoc owner checks) |

### 7.3 Proposed matrix

> **Reference only (decided 2026-11-04):** the owner selects every role's permissions. This matrix is not seeded and is no longer a default. It shows one reasonable starting point the owner may copy.

Scope: **All** = whole school, **Dept** = own department, **Own** = records they created, **Assigned** = tickets assigned to them.

| Permission | owner | school_admin | department_head | staff | operator |
|---|:-:|:-:|:-:|:-:|:-:|
| circular.view | All | All | Targeted | Targeted | Targeted |
| circular.create / update / delete / publish / assign | ✔ | ✔ | | | |
| circular.respond | | | Dept | Own (see Q3) | |
| circular.view_responses | All | All | Dept | | |
| maintenance.view | All | All | Dept | Own | Assigned |
| maintenance.create | ✔ | ✔ | ✔ | ✔ | |
| maintenance.assign / close / reject / reopen | ✔ | ✔ | | | |
| maintenance.update / submit_completion | ✔ | ✔ | | | Assigned |
| calendar.view | ✔ | ✔ | ✔ | ✔ | ✔ |
| calendar.manage | ✔ | ✔ | | | |
| users.view / create / update / deactivate / reset_password | ✔ | ✔ (not owner accounts) | | | |
| users.assign_role | ✔ | ✔ (never `owner`) | | | |
| roles.view | ✔ | ✔ | | | |
| reports.view / export | ✔ | ✔ | Dept (Q4) | | |
| audit.view | ✔ | ✔ | | | |
| settings.school.update | ✔ | ✔ | | | |
| settings.platform.update, backup.*, achievements.manage | ✔ | | | | |

### 7.4 Rules to keep or add

1. **Deny by default.** No grant, no access.
2. **Nobody but an owner can grant `owner`.** Enforced in the database, never only in the UI.
3. **Last owner and last school administrator cannot be removed, demoted or deactivated.**
4. **No self role edit.** A user cannot change their own role.
5. **Separation of duties:** technicians submit completion; a manager closes. Reporters cannot close their own tickets.
6. **One role per user** (simplest, and matches how the code resolves a role key today). **[Open]** Q5.
7. **Hidden owner** stays (decision D23).

### 7.5 Owner-managed roles (no code changes)

**What the owner can do without a developer:**

0. **Every role's permissions are chosen by the owner.** The five system roles ship with none.
1. Create, rename and delete custom roles.
2. Add or remove any permission on any role, including the five system roles.
3. Assign any role to a user (within the rules in 7.4).

**What this needs in the design:**

- The permission catalog (key, category, Arabic and English labels) moves into the database. Today it is hand-copied in three places: the SQL seed, `permissions.ts` and `permissionCatalog.ts` (finding F7). One source of truth removes the drift.
- Code that checks a role **name** instead of a permission is changed to check a permission (finding F1 and decision D19). For example the technician dropdown would list users whose role has `maintenance.update`, so a custom "Electrician" role works.
- The owner role is locked: it always has every permission automatically, so a new permission can never be missing for the owner (the problem `0060` had to repair).
- Safeguards: system roles cannot be deleted, a role with users cannot be deleted, the owner role cannot be edited, and every permission change is written to the audit log.
- Department limits stay on the user's assignment, not on the role.

**The one thing that still needs code:** a permission is only a label until something enforces it. Granting `maintenance.close` to a new role needs no code. Inventing a brand-new capability (say `library.manage`) needs a developer to add the policy and the screen that checks it. The owner controls who has what; a developer controls what exists.

**Keeping the UI untouched:** the role screens already exist (`CreateRoleDialog`, `EditRoleDialog`, `PermissionCheckboxGroup`). `PermissionCheckboxGroup` imports the catalog as a constant from a non-UI file, so the redesign keeps exporting the same shape from that file and fills it from the database on the server side. If that turns out to need a UI change, I will ask first (Q10).

---

## 8. What removing multi-tenancy does to roles

**[Proposed]** For the role system, specifically:

- `school_id` disappears from `user_role_assignments`, `roles` and every policy. `has_permission(key, department)` loses a parameter.
- The special case "platform-level = `school_id` null" goes away, so the `owner` assignment becomes a normal assignment of the `owner` role.
- Custom roles stay but lose their school link. System roles are seeded once and stay editable by the owner (permissions only; key and the owner role are locked).
- Triggers from `0020` and `0040` are rewritten around "the one owner/admin" instead of "per-school and platform-level".
- Caution: you asked to keep existing table and column names so the UI stays untouched. Dropping `school_id` can conflict with that if UI code reads it. This needs a UI read-only check before the design is final (Q7).

The full data redesign is a separate design document, which I will write after you approve this report.

---

## 9. Open questions

| # | Question |
|---|---|
| Q1 | Your list shows "Staff/operator" and "Teacher" and "Maintenance Technician". In code `staff` = Teacher and `operator` = Technician. Do you want a **separate administrative staff role** (e.g. clerk, counselor, secretary), or is this a duplicate to drop? |
| Q2 | Should **Assistant Principal / Deputy** be a separate role with fewer rights than Principal, or share `school_admin`? |
| Q3 | Should teachers be able to **acknowledge circulars** themselves (needs `circular.respond` for `staff`), or does only the Department Head respond for the department? (Finding F2.) |
| Q4 | Should Department Heads see **department-level reports**? |
| Q5 | **One role per user**, or can a user hold two (e.g. teacher and department head)? |
| Q6 | Should **school administrators be able to deactivate or reset passwords** for all non-owner users? |
| Q7 | May I **read UI files (read-only)** to confirm which role/school columns they depend on before finalizing the schema? (You said yes to reading; confirming for this specific purpose.) |
| Q8 | Do you want **audit.view** limited to administrators, or visible to department heads for their department? |
| Q9 | Should the owner's **hidden-from-everyone** behavior stay exactly as is (decision D23)? |
| Q10 | In your earlier message you said both "never change any UI file" and "you can edit UI files only if it is a must". I'll treat the first as the rule and **ask before any exception**. Correct? |
| Q11 | Should the owner be able to **delete a custom role that still has users** (users fall back to a default role) or must the role be emptied first? I recommend emptied first. |
| Q12 | When the owner changes a role's permissions, should it apply **immediately to logged-in users**, or at their next sign-in? I recommend immediately. |

---

## 10. Sources read

`supabase/migrations`: `0010`, `0020`, `0026`, `0027`, `0034`, `0040` (partial), `0049`, `0050`, `0059`, `0060`, `0061`.
`src`: `lib/rbac/*`, `lib/school/{assignUserRole,resolveRoleForAssignment,resolveUserRoleKey,applyUserRoleUpdate}.ts`, `lib/dashboard/resolveDashboardPermissions.ts`, `lib/circulars/getCircularPermissions.ts`, `lib/maintenance/assertTransitionRole.ts`, `actions/rbac/{assertCanUpdateRoleRecord,updateRoleAction}.ts`, `messages/{en,ar}.json` (role strings).
`docs`: `manuals/USER_MANUAL_INDEX.md`, `manuals/3_*` and `4_*` (partial), `decisions.md`, `audits/RBAC_Roles.md` (old).
`supabase/seed.sql` (header only), `AGENTS.md`.

Not read in full: RLS policies in `0011`, `0022`, `0040` for every table; `RBAC_Security.md`; `proxy.ts`; any UI component.
