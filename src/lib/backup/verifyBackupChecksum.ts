import { computeBackupChecksum } from "./computeBackupChecksum";
import type { DatabaseBackupPayload } from "./types";

/**
 * Refuses a file whose payload no longer matches its manifest.
 *
 * Older exports (before the manifest existed) have no checksum and are allowed
 * through unchanged; a file that claims a checksum must satisfy it.
 */
export function verifyBackupChecksum(payload: DatabaseBackupPayload): void {
  const expected = payload.metadata.checksum;
  if (!expected) return;

  const actual = computeBackupChecksum(payload.tables);
  if (actual !== expected) {
    throw new Error(
      "Backup checksum does not match its manifest: the file was edited or corrupted after export",
    );
  }
}
