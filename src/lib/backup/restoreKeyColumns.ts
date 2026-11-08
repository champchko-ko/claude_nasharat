/**
 * Columns that identify a row when the restore decides whether it already
 * exists. Mirrors the conflict target used by `restore_backup`.
 */
export function restoreKeyColumns(table: string): string[] {
  if (table === "school_settings") return ["singleton"];
  if (table === "role_permissions") return ["role_id", "permission_key"];
  if (table === "school_sequences") return ["kind", "year"];
  return ["id"];
}
