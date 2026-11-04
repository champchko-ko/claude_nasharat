# MASTER PROMPT — Comprehensive Production Readiness & Security Audit

Act as a senior software architect, principal application security engineer, senior QA automation engineer, database architect, and DevOps/release engineer.

Your mission is to perform a **genuine, comprehensive, evidence-based production-readiness audit** of the entire School Administration Portal codebase.

This is an audit, not a superficial project overview.

## 1. NON-NEGOTIABLE RULES

- Audit the entire codebase, not just `src/` or the main entry points.
- Do not assume that implemented-looking features actually work.
- Trace functionality through the complete execution path: UI → components → hooks → services → API/server actions → database → returned data → UI.
- Verify actual implementation, not comments, documentation, naming conventions, or assumptions.
- Never invent test results, successful integrations, security guarantees, or coverage.
- Do not modify, refactor, delete, overwrite, or automatically fix application source code.
- Do not apply database migrations or modify production data.
- Do not run destructive commands.
- Protect all environment variables, API keys, credentials, tokens, and private data.
- Preserve all existing functionality, RBAC, tenant isolation, integrations, and architectural decisions.
- If something cannot be verified, explicitly mark it UNVERIFIED.
- If the audit exceeds your context window, maintain a progress ledger and continue until every audit area is covered.

You may create or update ONLY the audit documentation file:
`docs/PRODUCTION_READINESS_AUDIT.md`

## 2. COMPLETE CODEBASE INVENTORY

Identify and inspect:

- Every application module, route, page, layout, component, hook, service, utility, and shared library.
- All API routes, server actions, middleware, background jobs, and integrations.
- Database schemas, migrations, SQL functions, triggers, constraints, indexes, and RLS policies.
- Authentication, authorization, RBAC, and tenant-resolution mechanisms.
- Configuration files, environment variables, build configuration, and deployment configuration.
- Existing unit, integration, end-to-end, security, and database tests.
- Dead code, duplicate functionality, unused dependencies, incomplete implementations, and TODO/FIXME markers.

Build a traceable inventory showing what was inspected and what remains unverified.

## 3. FUNCTIONAL INTEGRITY AUDIT

Verify every major feature end-to-end.

Check:

- All CRUD operations.
- Forms, validation, submission, and error handling.
- Data loading, caching, synchronization, and invalidation.
- Relationships between modules and pages.
- Correct usage of outputs returned by services and APIs.
- State management and persistence.
- Pagination, sorting, filtering, searching, and exports.
- Notifications and background operations.
- Loading, empty, success, failure, and retry states.
- Concurrent operations and race conditions.
- Navigation, deep links, and direct URL access.

Identify functions that appear implemented but are disconnected, incomplete, incorrectly wired, or produce incorrect results.

## 4. RBAC AND AUTHORIZATION AUDIT

Inspect every permission enforcement point.

Verify that the application's actual permissions match its intended role-permission matrix.

Check all roles, including:

- owner
- school_admin
- department_head
- staff
- operator
- auditor
- student_affairs

Verify:

- Every role has exactly the intended permissions.
- Unauthorized users cannot access restricted pages or actions.
- Backend authorization exists independently of frontend visibility.
- CRUD permissions are correctly enforced.
- Role escalation and privilege escalation are prevented.
- Direct API requests cannot bypass permissions.
- Sensitive administrative operations are protected.
- Role changes and account deactivation take effect correctly.
- Audit history cannot be tampered with by unauthorized users.

Identify every permission mismatch and missing enforcement point.

## 5. MULTI-TENANT ISOLATION AUDIT

Treat tenant isolation as a critical security boundary.

Verify:

- Tenant identification and resolution.
- Automatic school identification through the application's configured domain mechanism.
- Every database query is correctly tenant-scoped.
- Every create, read, update, and delete operation validates tenant ownership.
- Cross-school data access is impossible for ordinary school users.
- Server actions and API routes cannot be manipulated to access another tenant.
- Related records cannot introduce cross-tenant references.
- Supabase RLS policies enforce tenant boundaries independently of frontend logic.
- SQL functions, views, triggers, and SECURITY DEFINER functions do not bypass tenant restrictions.
- Storage buckets and file access enforce tenant isolation.
- Realtime subscriptions cannot expose another school's information.
- Cache keys and shared caches cannot leak data between tenants.
- Platform-owner privileges are explicitly defined and correctly restricted.

Attempt to identify realistic cross-tenant attack scenarios through code analysis and safe tests.

Do not claim isolation is secure merely because RLS is enabled.

## 6. SUPABASE AND DATABASE SECURITY AUDIT

Inspect the actual SQL definitions and migration history.

Verify:

- RLS enabled on all sensitive tables.
- SELECT, INSERT, UPDATE, and DELETE policies independently.
- Permissive policy interactions and unintended OR behavior.
- Policy recursion and unsafe helper functions.
- SECURITY DEFINER functions and their search paths.
- Authentication identity validation.
- Foreign keys, unique constraints, and check constraints.
- Data integrity and transaction boundaries.
- Indexes for frequently executed queries.
- Database functions' input parameters and return types.
- Migration consistency and deployment ordering.
- Storage security policies.
- Service-role key exposure risks.
- Correct separation of public, authenticated, and privileged database access.

Do not infer policy correctness from policy names. Read and analyze the actual SQL.

## 7. AUTHENTICATION AND SESSION SECURITY

Audit:

- Login, logout, registration, and account recovery.
- Session expiration and renewal.
- Token storage and validation.
- Password and credential handling.
- Account activation and deactivation.
- Unauthorized and expired sessions.
- CSRF, XSS, injection, and session-related vulnerabilities.
- Rate limiting and brute-force protections.
- Authentication middleware and server-side session verification.

## 8. APPLICATION SECURITY AUDIT

Inspect the complete attack surface for:

- OWASP Top 10 vulnerabilities.
- Broken access control.
- SQL and command injection.
- Cross-site scripting.
- CSRF.
- SSRF.
- Insecure direct object references.
- Open redirects.
- Unsafe file uploads and downloads.
- Sensitive information exposure.
- Insecure security headers and CORS.
- Weak cryptographic practices.
- Unsafe dependencies and vulnerable packages.
- Error messages exposing internal information.
- Logging of sensitive data.
- Insecure third-party integrations.

Classify each finding by severity and demonstrate its actual evidence.

## 9. BUSINESS LOGIC AND DATA ACCURACY

Verify all important calculations, formulas, statistics, dashboard KPIs, reports, charts, and aggregations.

For each metric:

- Identify its exact source.
- Trace its calculation.
- Verify filters and date boundaries.
- Verify role and tenant scope.
- Check null, empty, duplicate, and incomplete records.
- Check rounding and percentage calculations.
- Compare displayed results with underlying database records.
- Identify fabricated, hardcoded, stale, or incorrectly aggregated values.

Ensure charts and reports represent real application data.

## 10. FRONTEND AND UX QUALITY

Verify:

- Responsive behavior.
- Arabic RTL and English LTR behavior.
- Localization completeness.
- Form usability and validation.
- Accessibility and keyboard navigation.
- Error boundaries.
- Loading and empty states.
- Browser compatibility.
- Console errors and React warnings.
- Broken navigation and missing routes.

## 11. TESTING AND AUTOMATED VERIFICATION

Discover the actual package manager and existing test infrastructure.

Run appropriate non-destructive checks, including:

- TypeScript checks.
- ESLint.
- Production build.
- Unit tests.
- Integration tests.
- End-to-end tests, where configured.
- Database and RLS tests.
- Authentication and authorization tests.
- Tenant-isolation tests.
- Dependency vulnerability checks.

Do not alter dependencies or automatically fix reported problems.

Identify missing tests for critical workflows and security boundaries.

Distinguish clearly between:

- Tests executed and passed.
- Tests executed and failed.
- Tests not available.
- Tests not executed.
- Features verified manually.
- Features not verified.

## 12. PERFORMANCE AND RELIABILITY

Inspect:

- Slow database queries.
- N+1 queries.
- Unnecessary rendering and expensive computations.
- Memory leaks.
- Large bundles and unnecessary dependencies.
- Pagination and data-loading scalability.
- Caching correctness.
- Error recovery and retry behavior.
- Network failure handling.
- Concurrency and race conditions.
- Logging, monitoring, and observability.
- Backup and recovery readiness.

## 13. DEPLOYMENT AND PRODUCTION CONFIGURATION

Verify:

- Production build configuration.
- Environment variable completeness.
- Secret management.
- Production database configuration.
- Migration deployment process.
- Domain and HTTPS configuration.
- Security headers.
- CORS configuration.
- Error monitoring.
- Logging and operational monitoring.
- Backup and restoration procedures.
- Deployment and rollback procedures.
- Health checks.
- Dependency and runtime compatibility.

Never declare deployment readiness merely because the build succeeds.

## 14. REQUIRED AUDIT REPORT

Create `docs/PRODUCTION_READINESS_AUDIT.md`.

Include:

### A. Executive verdict

Choose exactly one:

- PRODUCTION READY
- CONDITIONALLY READY
- NOT PRODUCTION READY
- INSUFFICIENT EVIDENCE

### B. Critical findings

For each finding provide:

- Unique finding ID.
- Severity: CRITICAL / HIGH / MEDIUM / LOW / INFORMATIONAL.
- Exact file path and line numbers.
- Technical evidence.
- Explanation of the actual risk.
- Reproducible scenario or test evidence.
- Recommended correction.
- Required verification after correction.

### C. Feature verification matrix

List every major feature and its verification status.

### D. RBAC verification matrix

List every role, permission, enforcement location, and identified mismatch.

### E. Tenant isolation matrix

Document every relevant data boundary and its verification status.

### F. Database and RLS audit

Include actual policy and function findings.

### G. Test execution results

Include exact commands, exit codes, and actual results.

### H. Performance and reliability findings

### I. Deployment readiness checklist

### J. Unverified areas and remaining risks

### K. Prioritized remediation roadmap

Organize remediation into:

1. Release blockers.
2. Critical security fixes.
3. High-priority functional fixes.
4. Medium-priority improvements.
5. Long-term optimization.

## 15. FINAL ACCEPTANCE CRITERIA

Do not declare the application production-ready unless:

- Critical user workflows have been verified.
- RBAC is enforced on the backend.
- Multi-tenant isolation has been verified.
- Supabase RLS and database security have been inspected.
- No unresolved critical or high-severity security issues remain.
- Production build and relevant automated tests pass.
- Data integrity and business calculations are verified.
- Deployment, backup, and recovery procedures are sufficiently established.
- All remaining limitations are explicitly documented.

**IMPORTANT: A successful build, passing unit tests, or a clean-looking interface does not prove production readiness.**

Be skeptical, evidence-driven, and technically rigorous.

Start the complete audit now. Do not stop after inspecting the project structure or writing a preliminary overview. Continue systematically until the audit is complete or every remaining limitation is explicitly documented.
