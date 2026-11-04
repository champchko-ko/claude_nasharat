"use server";

import {
  assertCanManageBackup,
  computeRestoreDiff,
  validateBackupPayload,
  type RestoreDiff,
} from "@/lib/backup";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export type PreviewRestoreResult = ActionResult & {
  diff?: RestoreDiff;
};

/**
 * Computes what a restore would change without writing anything.
 *
 * The dialog shows added / overwritten / untouched counts so the operator
 * confirms against real numbers, not a table list. Validation runs through the
 * same entry point as the restore itself, so a file that previews successfully
 * cannot be rejected later for a format or scope reason.
 */
export async function previewRestoreAction(jsonPayload: unknown): Promise<PreviewRestoreResult> {
  try {
    const access = await assertCanManageBackup();
    if (!access.allowed) {
      throw new ForbiddenError("Unauthorized");
    }

    const payload = validateBackupPayload(jsonPayload);
    const diff = await computeRestoreDiff(createSupabaseAdminClient(), payload);

    return { success: true, diff };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
