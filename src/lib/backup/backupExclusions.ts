/**
 * What a JSON export deliberately does NOT contain, and why.
 *
 * The list is written into every export manifest, so a downloaded file states
 * its own limits instead of relying on a runbook nobody reads at 3 a.m.
 */
export type BackupExclusion = { item: string; reason: string };

export const BACKUP_EXCLUSIONS: readonly BackupExclusion[] = [
  {
    item: "audit_logs",
    reason: "Append-only forensic trail owned by the platform; a restore must not rewrite history.",
  },
  {
    item: "notifications",
    reason: "Transient per-user delivery state with no meaning in another environment.",
  },
  {
    item: "file_metadata",
    reason:
      "Points at storage objects that are not part of the JSON; restoring rows alone would dangle.",
  },
  {
    item: "storage_objects",
    reason: "Bucket contents are binaries; copy them with the storage API, not this export.",
  },
  {
    item: "permissions",
    reason:
      "The permission catalog is defined by migrations; restoring rows could drift from code.",
  },
  {
    item: "system_settings",
    reason: "Platform-level singleton configuration, not per-school configuration.",
  },
  {
    item: "auth_users",
    reason:
      "Credentials never leave the auth schema; a restore reconciles placeholder users instead.",
  },
];
