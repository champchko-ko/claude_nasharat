# Incident Response & Rollback Runbook

## 1. Severity Classifications

| Severity          | Definition                                                                                | Target Response   | Target Resolution   |
| ----------------- | ----------------------------------------------------------------------------------------- | ----------------- | ------------------- |
| **P1 - Critical** | Portal outage, data breach, cross-school data leak, or total auth failure                 | < 15 minutes      | < 2 hours           |
| **P2 - Major**    | Core workflow blocked (e.g. inability to publish circulars or triage maintenance tickets) | < 1 hour          | < 6 hours           |
| **P3 - Minor**    | Isolated cosmetic defects, localization formatting issues, non-blocking errors            | Next business day | Next sprint release |

## 2. Emergency Account & Session Revocation Procedure

If a user account or credentials are suspected of compromise:

1. **Immediate Deactivation**:
   - Navigate to `/settings/users` as School Administrator or Platform Owner.
   - Toggle the account status to **Deactivated** (`is_active = false`).
2. **Session Termination**:
   - In Supabase Auth dashboard or via Admin API, revoke all active refresh tokens for the user:
     ```typescript
     await supabaseAdmin.auth.admin.signOut(compromisedUserId);
     ```
   - The application middleware checks `is_active` on every route transition and redirects blocked users to `/login`.

## 3. Deployment Rollback Procedure

If a faulty release is deployed to production:

1. **Vercel Instant Rollback**:
   - Access the Vercel project deployment dashboard.
   - Select the previous stable deployment (tagged with green status).
   - Click **Instant Rollback**. Traffic is immediately routed to the prior build in < 1 minute.
2. **Database Rollback Guidelines**:
   - All migrations in this repository adhere to the **additive-first** pattern (expand-migrate-contract).
   - Columns and tables are not dropped in the same release that introduces changes, ensuring earlier application versions remain functional against the database.
   - If a rollback migration is strictly required, apply the inverse script documented in the migration notes. Never run `DROP TABLE` or `TRUNCATE` in production.

## 4. Post-Incident Review (PIR) Template

Following resolution of any P1 or P2 incident, complete the PIR document:

- **Incident Summary**: What happened and what was the customer impact?
- **Root Cause Analysis (RCA)**: Why did the failure occur?
- **Timeline of Events**: Chronological log from detection to resolution.
- **Preventative Measures**: What changes to tests, linters, or procedures will prevent recurrence?
