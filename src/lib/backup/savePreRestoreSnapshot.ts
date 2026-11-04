import { createSupabaseAdminClient } from "@/lib/supabase";
import { exportDatabaseBackup } from "./exportDatabaseBackup";
import type { BackupAccessResult } from "./assertCanManageBackup";

/**
 * Captures the data that is about to be replaced, before a restore starts.
 *
 * The snapshot is a full export of the target scope, not a copy of the file
 * being applied: the point is to be able to inspect (or re-apply) what the
 * restore overwrote. It is written with the service role into a table that only
 * the platform owner can read and that has no client write policy.
 */
export async function savePreRestoreSnapshot(
  access: BackupAccessResult,
  targetSchoolId: string | null,
): Promise<string> {
  const admin = createSupabaseAdminClient();
  const current = await exportDatabaseBackup({ ...access, schoolId: targetSchoolId });

  const { data, error } = await admin
    .from("backup_snapshots")
    .insert({
      school_id: targetSchoolId,
      created_by: access.userId,
      reason: "pre-restore",
      table_counts: current.metadata.tableCounts ?? {},
      payload: current,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Could not save the pre-restore snapshot: ${error?.message ?? "no row"}`);
  }

  return data.id as string;
}
