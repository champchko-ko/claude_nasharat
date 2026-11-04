import { createSupabaseAdminClient } from "@/lib/supabase";
import type { BackupAccessResult } from "./assertCanManageBackup";

export type BackupAuditInput = {
  access: BackupAccessResult;
  operation: "database.export" | "database.restore";
  phase: "start" | "success" | "failure";
  metadata?: Record<string, unknown>;
};

/**
 * Records an export or restore attempt.
 *
 * Before this, both paths were silent (audit finding M-18/M-38), so a
 * compromised owner account could read or overwrite every tenant and leave no
 * trace. Audit writes never abort the operation they describe: a failure to log
 * is printed, not thrown, or a successful restore would be reported as failed.
 */
export async function writeBackupAudit(input: BackupAuditInput): Promise<void> {
  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("audit_logs").insert({
    school_id: input.access.schoolId,
    actor_id: input.access.userId,
    actor_label: input.access.userEmail,
    action: `${input.operation}.${input.phase}`,
    entity_type: "database",
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error(
      `[Backup] Could not write the ${input.operation}.${input.phase} audit row:`,
      error.message,
    );
  }
}
