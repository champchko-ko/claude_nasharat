/**
 * Which column and values restrict a table to the backup's scope.
 *
 * `role_permissions` has no `school_id`, so it is scoped through the roles that
 * belong to the school. Returning a descriptor instead of branching inside each
 * query keeps the export and the restore preview on the same rule.
 */
export function resolveTableScope(
  tableName: string,
  schoolId: string | null,
  roleIds: string[] | null,
): { column: string; values: string[] } | null {
  if (!schoolId) return null;
  if (tableName === "schools") return { column: "id", values: [schoolId] };
  if (tableName === "role_permissions") {
    return { column: "role_id", values: roleIds ?? [] };
  }
  return { column: "school_id", values: [schoolId] };
}
