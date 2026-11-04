import { BACKUP_EXCLUSIONS } from "./backupExclusions";
import { BACKUP_FORMAT_VERSION } from "./backupFormatVersion";
import { computeBackupChecksum } from "./computeBackupChecksum";
import type { BackupMetadata, DatabaseBackupPayload } from "./types";

/**
 * Builds the self-describing header of an export: when it was taken, by whom,
 * for which scope, how many rows per table, and the checksum of the payload.
 * The exclusion list travels with the file so its limits are never implicit.
 */
export function buildBackupManifest(input: {
  exportedBy: string;
  scope: "platform" | "school";
  schoolId: string | null;
  schoolName: string | null;
  tables: DatabaseBackupPayload["tables"];
}): BackupMetadata {
  const tableCounts: Record<string, number> = {};
  let totalRows = 0;

  for (const [table, rows] of Object.entries(input.tables)) {
    const count = rows?.length ?? 0;
    tableCounts[table] = count;
    totalRows += count;
  }

  return {
    version: BACKUP_FORMAT_VERSION,
    schemaVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    exportedBy: input.exportedBy,
    scope: input.scope,
    schoolId: input.schoolId,
    schoolName: input.schoolName,
    tableCounts,
    totalRows,
    checksum: computeBackupChecksum(input.tables),
    exclusions: BACKUP_EXCLUSIONS.map((exclusion) => ({ ...exclusion })),
  };
}
