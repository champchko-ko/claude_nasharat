import { createSupabaseAdminClient } from "@/lib/supabase";
import { savePreRestoreSnapshot } from "./savePreRestoreSnapshot";
import { validateBackupPayload } from "./validateBackupPayload";
import type { BackupAccessResult } from "./assertCanManageBackup";
import type { RestoreSummary } from "./types";

/**
 * Restores a parsed backup in one database transaction.
 *
 * Order of checks: envelope → checksum → tenant scope → snapshot → RPC. The
 * snapshot is written before the transaction starts, so it survives a failed
 * restore and records exactly what was about to be replaced. The RPC performs
 * every table write in a single transaction: a failure leaves the database
 * untouched.
 */
export async function restoreDatabaseBackup(
  access: BackupAccessResult,
  rawJson: unknown,
): Promise<RestoreSummary> {
  const payload = validateBackupPayload(rawJson);

  if (!access.userId) {
    throw new Error("A restore needs an authenticated operator");
  }

  const targetSchoolId = payload.metadata.scope === "school" ? payload.metadata.schoolId : null;
  const snapshotId = await savePreRestoreSnapshot(access, targetSchoolId);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.rpc("restore_backup", {
    p_tables: payload.tables,
    p_actor: access.userId,
  });

  if (error) {
    throw new Error(`Restore failed and the database was left unchanged: ${error.message}`);
  }

  const result = data as {
    tableCounts: Record<string, number>;
    totalRecords: number;
    authUsersCreated: number;
  };

  return {
    success: true,
    totalRecords: result.totalRecords,
    tableCounts: result.tableCounts,
    authUsersCreated: result.authUsersCreated,
    snapshotId,
  };
}
