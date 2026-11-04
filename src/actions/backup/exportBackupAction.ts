"use server";

import {
  assertCanManageBackup,
  exportDatabaseBackup,
  writeBackupAudit,
  type DatabaseBackupPayload,
} from "@/lib/backup";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export type ExportBackupResult = ActionResult & {
  backup?: DatabaseBackupPayload;
};

export async function exportBackupAction(): Promise<ExportBackupResult> {
  try {
    const access = await assertCanManageBackup();
    if (!access.allowed) {
      throw new ForbiddenError("Unauthorized");
    }

    await writeBackupAudit({ access, operation: "database.export", phase: "start" });

    try {
      const backup = await exportDatabaseBackup(access);

      await writeBackupAudit({
        access,
        operation: "database.export",
        phase: "success",
        metadata: {
          scope: backup.metadata.scope,
          schoolId: backup.metadata.schoolId,
          totalRows: backup.metadata.totalRows,
          tableCounts: backup.metadata.tableCounts,
          checksum: backup.metadata.checksum,
        },
      });

      return { success: true, backup };
    } catch (exportError: unknown) {
      await writeBackupAudit({
        access,
        operation: "database.export",
        phase: "failure",
        metadata: { message: sanitizeError(exportError).message },
      });
      throw exportError;
    }
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
