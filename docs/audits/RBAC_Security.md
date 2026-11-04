What you need is a Full RBAC Security & Authorization Audit, not just a review of the roles or a few permission tests.

I recommend instructing Gemini CLI / Antigravity to perform a complete audit of every role, every permission, every operation, and every possible privilege-escalation path.

The most important requirement is that the `owner` and `school_admin` accounts must be protected against unauthorized modification, privilege escalation, deletion, deactivation, or lockout.

Below is the prompt I recommend adding as a separate task for Gemini.

# Master RBAC Audit & Security Verification Prompt

Production security audit

Gemini CLI / Antigravity

# MASTER TASK: COMPLETE RBAC, AUTHORIZATION & PRIVILEGE-ESCALATION SECURITY AUDIT

Act as a Senior Application Security Engineer, RBAC Architect, and QA Security Auditor.

Your mission is to conduct a COMPLETE, evidence-based security audit of the application's role-based access control (RBAC) implementation.

The objective is to establish whether every role, permission, and protected operation is implemented correctly, consistently, and securely across the ENTIRE application.

**Do not assume that existing permissions are correct just because the UI hides unauthorized buttons or because some tests pass.**

This is a security-critical audit. Do not declare success without comprehensive evidence.

---

## PHASE 1 — DISCOVER THE COMPLETE RBAC ARCHITECTURE

Inspect the entire codebase and identify:

1. All existing roles and their actual implementations.
2. All permissions and permission definitions.
3. Role-to-permission mappings.
4. Any direct role checks and conditional authorization logic.
5. Authentication and session management.
6. User creation, modification, deletion, and role assignment.
7. API routes, server actions, server components, and protected operations.
8. Database security policies and access rules.
9. Middleware and route protection.
10. Background jobs, scheduled tasks, exports, and integrations that access protected data.
11. All frontend and backend authorization mechanisms.
12. Any duplicated, conflicting, incomplete, or inconsistent permission implementations.

Do not rely exclusively on documentation. Verify every finding against actual source code.

Produce a complete inventory of the application's actual RBAC architecture before making changes.

---

## PHASE 2 — AUDIT EVERY ROLE INDIVIDUALLY

Audit every role actually defined in the application.

At minimum, verify the following roles if they exist:

### 1. OWNER — Platform Owner

- Full platform-level administrative authority.
- Protected platform configuration and governance.
- Authorized management of school tenants.
- Authorized management of school administrators.
- Access to platform-level security and audit information.
- Protection against unauthorized role modification, deletion, suspension, or deactivation.
- Protection against unauthorized password, email, and account ownership changes.
- Protection against unauthorized privilege escalation.
- Protection against self-lockout and accidental loss of the last owner.
- Verify whether owner-only operations are truly restricted to authorized owners.

### 2. SCHOOL_ADMIN — School Administrator

- Full administrative control within the authorized school tenant.
- User and staff management.
- Role and permission management within explicitly authorized boundaries.
- School settings and configuration.
- Administrative circulars and assignments.
- Maintenance and service requests.
- School calendar and public information.
- Reports and administrative operations.
- Protection against unauthorized deletion, deactivation, demotion, or modification.
- Protection against privilege escalation to platform owner.
- Protection against access to other schools.

### 3. DEPARTMENT_HEAD — Head of Department

- Department-specific permissions.
- Authorized departmental operations.
- Circular responses and achievements.
- Maintenance requests and department-related management.
- Department-level reports.
- Verify that access to other departments is restricted unless explicitly authorized.

### 4. STAFF — Teacher / Staff

- Access to authorized school information.
- Circulars and calendar access.
- Authorized maintenance requests.
- Only explicitly granted staff operations.
- No unauthorized administrative operations.

### 5. OPERATOR — Maintenance Technician

- Access to assigned maintenance tasks.
- Ability to update authorized task progress.
- Ability to upload completion photographs.
- No unauthorized access to administrative, financial, personnel, or student information.

### 6. AUDITOR — Read-only Auditor

- Authorized reports and audit logs.
- Read-only access where specified.
- No unauthorized creation, modification, deletion, approval, or administrative actions.
- No ability to change permissions or user roles.

IMPORTANT:\
The list above is an audit starting point, not permission to invent or change the application's existing role definitions.

Discover all actual roles, including any additional roles or custom permission groups.

---

## PHASE 3 — CREATE A COMPLETE ROLE-PERMISSION MATRIX

Produce a comprehensive matrix covering:

- Every role.
- Every application module.
- Every resource.
- Every operation.
- Every permission.
- Every relevant scope.

For each operation, independently verify:

- CREATE
- READ
- UPDATE
- DELETE
- APPROVE
- ASSIGN
- EXPORT
- MANAGE
- CONFIGURE
- Any additional operation actually implemented.

Include all relevant modules, such as:

- Users and accounts.
- Roles and permissions.
- Schools and tenants.
- School settings.
- Circulars and assignments.
- Maintenance.
- Calendar.
- Reports.
- Audit logs.
- Notifications.
- Authentication and account security.
- Any additional modules discovered.

For each permission, record:

1. Role.
2. Module.
3. Resource.
4. Operation.
5. Authorized scope.
6. Expected access.
7. Actual access.
8. Frontend enforcement.
9. Backend enforcement.
10. Database-level enforcement, where applicable.
11. Test evidence.
12. Final result.

Use these statuses:

- ALLOWED
- DENIED
- PARTIALLY ALLOWED
- NOT IMPLEMENTED
- INCONSISTENT
- NOT VERIFIED

Do not assume that a permission is implemented merely because it exists in a permission configuration.

---

## PHASE 4 — CRITICAL OWNER & ADMIN PROTECTION AUDIT

THIS PHASE HAS THE HIGHEST SECURITY PRIORITY.

Investigate every possible way the owner or school administrator could lose control of their account or privileges.

### OWNER protection

Verify that unauthorized users cannot:

- Delete the owner account.
- Deactivate or suspend the owner.
- Change the owner's role.
- Demote the owner.
- Modify the owner's protected permissions.
- Change the owner's email or credentials.
- Reset the owner's password without an authorized verification process.
- Take ownership of the platform.
- Create another unauthorized owner.
- Modify protected owner records through direct API requests.
- Modify owner records through database operations or manipulated identifiers.
- Bypass owner protection through background jobs or alternative application workflows.

Verify that legitimate owner management operations remain functional.

### SCHOOL_ADMIN protection

Verify that unauthorized users cannot:

- Delete the last active school administrator.
- Remove the last administrator's administrative privileges.
- Deactivate the last administrator.
- Demote the administrator without authorized procedures.
- Modify administrator permissions through unauthorized APIs.
- Escalate their privileges to school administrator.
- Access or modify another tenant's administrator.
- Bypass administrator protections through direct database or server operations.

### Self-protection and lockout prevention

Test:

- Owner attempting to remove their own critical privileges.
- Administrator attempting to remove their own critical privileges.
- Deletion of the last owner.
- Deletion of the last active school administrator.
- Simultaneous administrative requests that could remove the last protected account.
- Concurrent role modifications.
- Account deactivation and recovery scenarios.

Determine the exact intended protection policy from existing requirements.

Do not assume that an owner or administrator must be prevented from every legitimate management action. Protection must prevent unauthorized or accidental lockout without breaking legitimate governance.

---

## PHASE 5 — PRIVILEGE ESCALATION & SECURITY ATTACK TESTING

Perform adversarial security testing.

Attempt to identify whether a lower-privileged user can gain unauthorized access by:

1. Changing their role in the browser.
2. Modifying request payloads.
3. Manipulating user IDs.
4. Manipulating tenant IDs.
5. Calling protected API endpoints directly.
6. Invoking server actions directly.
7. Modifying session or authentication data.
8. Accessing restricted routes directly.
9. Changing resource ownership identifiers.
10. Reusing another user's identifiers.
11. Modifying database records through unauthorized paths.
12. Exploiting missing server-side authorization checks.
13. Abusing bulk operations.
14. Exploiting exports and report generation.
15. Using stale sessions after role changes.
16. Accessing previously authorized data after account deactivation.
17. Exploiting race conditions in role or account management.

Test both horizontal privilege escalation (accessing another user's resources) and vertical privilege escalation (obtaining higher privileges).

All destructive tests MUST run in an isolated test environment using dedicated test accounts and test data.

Never experiment with real production owner or administrator accounts.

---

## PHASE 6 — MULTI-TENANT ISOLATION

If the application supports multiple schools or tenants, verify complete tenant isolation.

Test:

- Cross-tenant user access.
- Cross-tenant student access.
- Cross-tenant reports and exports.
- Cross-tenant settings.
- Cross-tenant circulars.
- Cross-tenant maintenance records.
- Cross-tenant calendar data.
- Cross-tenant administrator management.
- Cross-tenant database queries.
- Cross-tenant background operations.

Verify that changing a tenant ID or resource ID cannot bypass authorization.

Tenant resolution must use the application's established trusted mechanism.

Never rely solely on frontend filtering or client-supplied tenant identifiers.

---

## PHASE 7 — FRONTEND, BACKEND & DATABASE CONSISTENCY

Verify every protected feature at all relevant enforcement layers.

For each operation, determine:

1. Is the UI correctly displaying or hiding the operation?
2. Does the frontend prevent unauthorized interactions?
3. Does the backend independently enforce authorization?
4. Are database security rules or policies correctly configured?
5. Are ownership and tenant boundaries verified?
6. Are errors returned safely without exposing sensitive information?

CRITICAL:

Hiding a button is NOT authorization.

Protecting a frontend route is NOT authorization.

A backend permission check is NOT sufficient if database access paths bypass it.

Every accessible operation must be protected at the appropriate authoritative enforcement layer.

---

## PHASE 8 — AUTOMATED RBAC TEST SUITE

Create or extend a comprehensive automated authorization test suite.

For every role and protected operation, test:

- Authorized access succeeds.
- Unauthorized access is denied.
- Direct API access is denied.
- Unauthorized modification is denied.
- Unauthorized deletion is denied.
- Cross-tenant access is denied.
- Privilege escalation is denied.
- Protected owner/admin accounts cannot be improperly modified.
- Role changes take effect correctly.
- Deactivated users lose access.
- Stale sessions cannot retain revoked privileges.

Include regression tests for every discovered security defect.

Use the existing test framework and conventions.

Do not introduce an unnecessary testing framework or duplicate existing test infrastructure.

Never weaken existing tests, security policies, or permission checks to achieve passing results.

---

## PHASE 9 — FIX VERIFIED SECURITY DEFECTS

After completing the initial audit:

1. Classify findings by severity: CRITICAL, HIGH, MEDIUM, LOW, and INFORMATIONAL.
2. Identify the exact vulnerable files and code paths.
3. Explain the root cause and potential impact.
4. Propose the safest correction.
5. Implement confirmed defects only when the intended behavior is sufficiently established.
6. Preserve existing functionality and role responsibilities.
7. Follow all repository architecture and modularity rules in AGENTS.md.
8. Add regression tests.
9. Re-run the relevant security and regression suites.

Do not perform broad rewrites of the RBAC architecture without first establishing the need and impact.

Do not silently change the permission matrix.

If intended permissions are unclear, document the discrepancy and request clarification before changing behavior.

---

## PHASE 10 — FINAL SECURITY AUDIT REPORT

Produce the following deliverables:

### A. Complete Role-Permission Matrix

A comprehensive matrix of all actual roles, modules, resources, operations, and scopes.

### B. Owner Protection Report

Detailed verification of owner account protection, ownership integrity, and lockout prevention.

### C. Administrator Protection Report

Detailed verification of school administrator protection and tenant-level authority.

### D. Privilege Escalation Report

All tested attack scenarios, results, and evidence.

### E. Multi-Tenant Isolation Report

Verification of tenant boundaries and cross-tenant access prevention.

### F. RBAC Implementation Map

Exact file paths for:

- Role definitions.
- Permission definitions.
- Permission mappings.
- Frontend authorization.
- Backend authorization.
- Database security.
- Authentication and sessions.
- Automated security tests.

### G. Defect Register

Each finding must include:

- Unique ID.
- Severity.
- Affected role.
- Affected module.
- Exact file and relevant code location.
- Root cause.
- Exploitation scenario.
- Recommended correction.
- Actual remediation status.
- Regression test reference.

### H. Test Execution Report

Exact commands, actual execution results, passed tests, failed tests, blocked tests, and unverified scenarios.

### I. Final Security Verdict

Choose exactly one:

- **PASS — VERIFIED:** All defined authorization requirements have been implemented and all required tests have passed, with no unresolved findings in the audited scope.
- **CONDITIONAL PASS:** No unresolved critical or high findings, but documented limitations or unverified items remain.
- **FAIL:** One or more confirmed security vulnerabilities or authorization defects remain.
- **INCONCLUSIVE:** The audit lacks sufficient evidence or test coverage to establish security.

Never claim that the application is 100% secure based only on code inspection or automated tests.

A complete security assessment requires evidence from source inspection, automated tests, direct authorization testing, and database security verification.

---

## NON-NEGOTIABLE RULES

- Do not invent permissions.
- Do not assume roles are correctly implemented.
- Do not trust frontend-only protection.
- Do not trust client-supplied role or tenant identifiers.
- Do not use fabricated test results.
- Do not skip any discovered role or protected operation.
- Do not delete existing functionality.
- Do not weaken security to make tests pass.
- Do not modify real production owner/admin accounts during testing.
- Do not claim success without evidence.

**The goal is not to make the RBAC implementation look correct. The goal is to prove that unauthorized operations are actually impossible within the defined security boundaries, while every authorized operation continues to work correctly.**

## My three most important recommendations

1\. Test the backend, not just the interface. A staff member who cannot see an Admin button but can call the underlying API is a serious security vulnerability.

2\. Protect the last owner and last school administrator. Their deletion, demotion, and deactivation protections should be enforced atomically on the server/database where appropriate, not just through frontend confirmation dialogs.

3\. Require a test for every role × operation combination. Do not accept a report saying "RBAC tests passed" without a complete permission matrix and evidence.

For your existing six-role architecture, this is particularly important because the `owner` has platform-level authority, whereas `school_admin` must remain restricted to its own school.&#x20;

My advice: First ask Gemini to perform Phases 1–8 as an audit-only operation, without changing code. Review its findings and permission matrix. Only then authorize Phase 9 to fix confirmed vulnerabilities. This prevents an AI agent from accidentally weakening or redesigning your existing security model while supposedly auditing it.
