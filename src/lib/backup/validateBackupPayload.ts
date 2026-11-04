import { assertBackupTenantScope } from "./assertBackupTenantScope";
import { backupSchema } from "./backupSchema";
import { verifyBackupChecksum } from "./verifyBackupChecksum";
import type { DatabaseBackupPayload } from "./types";

/**
 * The single entry point for untrusted backup JSON: envelope, version ceiling,
 * checksum, then tenant scope. Both preview and restore go through it, so the
 * two can never disagree about what is valid.
 */
export function validateBackupPayload(rawJson: unknown): DatabaseBackupPayload {
  const parsed = backupSchema.safeParse(rawJson);
  if (!parsed.success) {
    throw new Error(`Invalid backup JSON format: ${parsed.error.message}`);
  }

  verifyBackupChecksum(parsed.data);
  assertBackupTenantScope(parsed.data);

  return parsed.data;
}
