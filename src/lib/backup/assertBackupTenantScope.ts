import type { DatabaseBackupPayload } from "./types";

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

  for (const row of payload.tables.school_settings ?? []) {
    if (row.singleton !== true) {
      throw new Error("Backup school settings must target singleton=true");
    }
  }
}
