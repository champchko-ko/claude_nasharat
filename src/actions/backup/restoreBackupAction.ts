"use server";

import { revalidatePath } from "next/cache";
import {
  assertCanManageBackup,
  restoreDatabaseBackup,
  validateBackupPayload,
  writeBackupAudit,
  type RestoreSummary,
} from "@/lib/backup";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export type RestoreBackupResult = ActionResult & {
  summary?: RestoreSummary;
};

export async function restoreBackupAction(jsonPayload: unknown): Promise<RestoreBackupResult> {
  try {
    const access = await assertCanManageBackup();
    if (!access.allowed) {
      throw new ForbiddenError("Unauthorized");
    }

    // Validate before auditing "start" so a malformed file does not look like
    // an attempted restore in the trail.
    const payload = validateBackupPayload(jsonPayload);

    await writeBackupAudit({
      access,
      operation: "database.restore",
      phase: "start",
      metadata: {
        scope: payload.metadata.scope,
        schoolId: payload.metadata.schoolId,
        totalRows: payload.metadata.totalRows,
        checksum: payload.metadata.checksum,
      },
    });

    try {
      const summary = await restoreDatabaseBackup(access, payload);

      await writeBackupAudit({
        access,
        operation: "database.restore",
        phase: "success",
        metadata: {
          scope: payload.metadata.scope,
          totalRecords: summary.totalRecords,
          tableCounts: summary.tableCounts,
          snapshotId: summary.snapshotId,
          authUsersCreated: summary.authUsersCreated,
        },
      });

      revalidatePath("/", "layout");

      return { success: true, summary };
    } catch (restoreError: unknown) {
      await writeBackupAudit({
        access,
        operation: "database.restore",
        phase: "failure",
        metadata: { message: sanitizeError(restoreError).message },
      });
      throw restoreError;
    }
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
