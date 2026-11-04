import type { DatabaseBackupPayload } from "./types";

const TENANT_TABLES = [
  "school_settings",
  "departments",
  "locations",
  "roles",
  "profiles",
  "user_role_assignments",
  "school_sequences",
  "circulars",
  "circular_targets",
  "circular_responses",
  "maintenance_requests",
  "maintenance_assignments",
  "maintenance_updates",
  "calendar_events",
  "school_achievements",
] as const;

/**
 * Rejects a school-scoped file that carries rows for another tenant.
 *
 * `restore_backup` repeats this check in SQL; this pass exists so the operator
 * gets a precise message in the UI before anything is written, and so the rule
 * is covered by a unit test that does not need a database.
 */
export function assertBackupTenantScope(payload: DatabaseBackupPayload): void {
  if (payload.metadata.scope !== "school") return;

  const schoolId = payload.metadata.schoolId;
  if (!schoolId) {
    throw new Error("A school-scoped backup must name its school");
  }

  for (const row of payload.tables.schools ?? []) {
    if (row.id !== schoolId) {
      throw new Error("Backup contains a school other than the restore target");
    }
  }

  for (const table of TENANT_TABLES) {
    const rows = payload.tables[table] ?? [];
    for (const row of rows) {
      if (row.school_id !== schoolId) {
        throw new Error(`Backup table ${table} contains a row outside the restore target`);
      }
    }
  }
}
