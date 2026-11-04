# Backup & Disaster Recovery Runbook

## 1. What actually gets backed up

Two stateful layers must both be covered:

1. **PostgreSQL (Supabase)** — schema, RLS policies, roles, circulars, maintenance
   tickets, calendar events, achievements, users, notifications, audit logs.
2. **Supabase Storage** — `circular-attachments` (private), `maintenance-photos`
   (private), `public-assets` (public).

The in-app JSON export **only covers a subset of layer 1** (see §5). It is a
per-school configuration export, not a disaster-recovery backup. Layer 2 is
never included.

## 2. Platform backups (disaster recovery)

1. **Managed backups** — Supabase takes daily backups on paid plans. Confirm the
   project's plan and retention window in the dashboard and record it here:
   - plan / retention: `<to be filled by the operator>`
2. **Point-in-time recovery (PITR)** — only available on plans that include it.
   If it is enabled, record the recovery window. If it is not, the
   `supabase db dump` procedure in §6 is the fallback.
3. **Pre-migration logical dump** — before any non-trivial production migration:

   ```bash
   supabase db dump --db-url "$DATABASE_URL" \
     -f "backups/pre-migration-$(date +%Y%m%d%H%M%S).sql"
   ```

   Store dumps encrypted and off-site, with access limited to the platform owner.

**Never test a restore against production.** Use a throwaway project (§6.2).

## 3. Storage bucket backups

Object metadata lives in `public.file_metadata` and in the circular/maintenance
attachment tables. Copy the binaries separately — the SQL dump contains rows,
not files:

```bash
aws s3 sync s3://supabase-project-id/maintenance-photos \
  ./backups/storage/maintenance-photos \
  --endpoint-url "$STORAGE_S3_ENDPOINT"
```

Repeat for `circular-attachments` and `public-assets`.

## 4. Disaster-recovery drill

Run this at least once per quarter, and always before a major release.

1. Create a throwaway Supabase project (never the production project).
2. Restore the latest dump:

   ```bash
   psql "$STAGING_DATABASE_URL" -f "backups/latest.sql"
   ```

3. Point a local `.env.local` at the throwaway project and run:

   ```bash
   npm run test:rls   # 132 authorization checks (the battery prints its own total)
   npm run test:e2e   # authenticated workflows
   ```

4. Verify invariants:
   - `is_platform_owner()` resolves for the owner account.
   - `next_school_number(...)` allocates `CIR-` / `MR-` numbers.
   - `enforce_maintenance_transition` and the audit triggers are present.
   - A deactivated user can no longer read school data.
5. Reconcile row counts against the source:

   ```sql
   select relname, n_live_tup from pg_stat_user_tables order by relname;
   ```

6. Only then switch traffic by updating `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` and
   redeploying.

## 5. In-app JSON export and restore (`/settings/backup`)

### What it is

An owner-only, on-demand **per-school configuration export** (or a platform-wide
export when the owner has no school). It is useful for moving configuration
between environments and for exporting a tenant before a risky change.

It is **not** a disaster-recovery backup:

- no passwords — restored accounts cannot sign in until a recovery flow sets one;
- no storage objects — attachments and photos are not in the JSON;
- no audit trail — `audit_logs` is append-only platform history;
- no `notifications`, `file_metadata`, `permissions` or `system_settings`.

Every export states these exclusions inside `metadata.exclusions`, so the file
is self-describing.

### Export

1. Sign in as Platform Owner → **Settings > Database Backup**.
2. Click **Export Database Backup**.
3. The server reads every table in dependency order with pagination
   (1,000 rows per request), aborts on any error, and reconciles each table's
   row count. A partial file is never produced.
4. The download is `backup-<scope>-<YYYY-MM-DD>.json` and carries a manifest:
   `exportedAt`, `exportedBy`, `scope`, `schoolId`, per-table counts, `totalRows`,
   a SHA-256 `checksum` and the exclusion list.
5. Each export writes `database.export.start/success/failure` rows to
   `audit_logs`.

### Restore

1. Open `/settings/backup`, select a `.json` file (maximum **10 MB**).
2. The dialog shows the manifest and a **preview**: new records, overwritten
   records and untouched records. Previewing reads the database; it writes
   nothing.
3. On confirmation, the server:
   - validates the envelope and version ceiling (Zod),
   - verifies the checksum (a hand-edited file is rejected),
   - verifies that every school-scoped row belongs to the file's school,
   - saves a **pre-restore snapshot** in `backup_snapshots`,
   - calls `restore_backup(...)`, which writes all tables in **one transaction**.
4. If any table fails, the transaction rolls back and no row is written. If the
   restore succeeds, the success message includes the snapshot id.
5. `database.restore.start/success/failure` rows are written to `audit_logs`.

### Restore semantics

- **Upsert-only.** Restore inserts rows that are missing and updates rows whose
  key already exists. It **never deletes** anything that is absent from the file.
  Rolling back a restore requires the §6 procedure (dump/PITR), not another
  restore.
- **Partial rows are allowed.** A row that omits a column keeps the database
  default on insert and the current value on update.
- **Owner-only, verified twice.** The page requires the owner role; the SQL
  function independently checks that the actor holds an active, platform-scoped
  `owner` assignment.
- **Auth accounts.** A restore creates placeholder `auth.users` rows for any
  missing profile so the `profiles.id` foreign key holds. Credentials are blank
  by design.

### What the JSON does not restore

| Excluded                          | Reason                                                                 |
| --------------------------------- | ---------------------------------------------------------------------- |
| `audit_logs`                      | Append-only forensic trail; a restore must not rewrite history         |
| `notifications`                   | Transient per-user delivery state                                      |
| `file_metadata` / storage objects | Binaries are outside the JSON; rows alone would dangle                 |
| `permissions`                     | Catalog is defined by migrations; restoring rows could drift from code |
| `system_settings`                 | Platform singleton configuration                                       |
| `auth.users` credentials          | Passwords never leave the auth schema                                  |

## 6. Full disaster recovery (authoritative procedure)

### 6.1 Take the dump

```bash
# Schema + data + roles
supabase db dump --db-url "$PROD_DATABASE_URL" -f backups/schema.sql
supabase db dump --db-url "$PROD_DATABASE_URL" --data-only -f backups/data.sql
```

Also copy the three storage buckets (§3). A dump without the bucket contents
restores a database whose attachment rows point at missing files.

### 6.2 Restore into a throwaway project

```bash
psql "$STAGING_DATABASE_URL" -f backups/schema.sql
psql "$STAGING_DATABASE_URL" -f backups/data.sql
```

Run the drill in §4 before touching production. The in-app JSON restore must not
be used for this: it cannot recreate roles, policies, auth credentials, audit
history or storage.

### 6.3 Data-only recovery after an incident

1. `supabase db dump --data-only` from the latest good copy.
2. Restore into a throwaway project and reconcile counts (§4.5).
3. Restore into production only during a declared maintenance window, after
   taking a fresh production snapshot.
