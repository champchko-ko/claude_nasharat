/**
 * Which column and values restrict a table to the backup's scope.
 *
 * The schema is singleton-scoped. Only the schools table needs a row filter;
 * every other exported table belongs to that one deployment.
 */
export function resolveTableScope(
  tableName: string,
  schoolId: string | null,
  roleIds: string[] | null,
): { column: string; values: string[] } | null {
  if (!schoolId) return null;
  if (tableName === "schools") return { column: "id", values: [schoolId] };
  if (tableName === "school_settings") return { column: "singleton", values: ["true"] };
  void roleIds;
  return null;
}
