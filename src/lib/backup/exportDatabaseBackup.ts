import { createSupabaseAdminClient } from "@/lib/supabase";
import { getPlatformOwnerUserIds } from "@/lib/auth/getPlatformOwnerUserIds";
import { BACKUP_TABLES } from "./backupTables";
import { buildBackupManifest } from "./buildBackupManifest";
import { fetchTableData } from "./fetchTableData";
import type { BackupAccessResult } from "./assertCanManageBackup";
import type { DatabaseBackupPayload } from "./types";

/**
 * Reads every table in the backup contract, completely.
 *
 * Any table-level failure aborts the whole export: a partial file that still
 * says `success: true` is worse than no file, because it silently restores a
 * truncated tenant.
 */
export async function exportDatabaseBackup(
  access: BackupAccessResult,
): Promise<DatabaseBackupPayload> {
  const admin = createSupabaseAdminClient();
  const schoolId = access.schoolId;
  const scope = schoolId ? "school" : "platform";

  const [school, ownerUserIds] = await Promise.all([
    schoolId
      ? admin.from("schools").select("name_ar, name_en").eq("id", schoolId).maybeSingle()
      : Promise.resolve({ data: null }),
    getPlatformOwnerUserIds(),
  ]);

  const schoolName = (school.data?.name_ar || school.data?.name_en) ?? null;

  const tableResults = await Promise.all(
    BACKUP_TABLES.map(async (table) => {
      const rows = await fetchTableData(admin, table.name, schoolId, ownerUserIds);
      return [table.name, rows] as const;
    }),
  );

  const tables: DatabaseBackupPayload["tables"] = Object.fromEntries(tableResults);

  return {
    metadata: buildBackupManifest({
      exportedBy: access.userId ?? "system",
      scope,
      schoolId: schoolId ?? null,
      schoolName,
      tables,
    }),
    tables,
  };
}
