import { MAX_BACKUP_BYTES } from "@/lib/backup/maxBackupBytes";
import type { DatabaseBackupPayload } from "@/lib/backup/types";

export type BackupFileResult =
  { ok: true; payload: DatabaseBackupPayload } | { ok: false; reason: "too-large" | "invalid" };

/**
 * Reads a selected file, refusing anything the Server Action could not carry
 * and anything that is not shaped like a backup envelope.
 *
 * The size check runs before reading: a 2 GB file should never be loaded into
 * the tab just to fail at the transport.
 */
export async function parseBackupFile(file: File): Promise<BackupFileResult> {
  if (file.size > MAX_BACKUP_BYTES) {
    return { ok: false, reason: "too-large" };
  }

  try {
    const parsed = JSON.parse(await file.text()) as DatabaseBackupPayload;
    if (!parsed?.metadata || !parsed?.tables) {
      return { ok: false, reason: "invalid" };
    }
    return { ok: true, payload: parsed };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
