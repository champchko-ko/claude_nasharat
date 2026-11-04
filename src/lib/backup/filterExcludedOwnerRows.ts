export function filterExcludedOwnerRows(
  tableName: string,
  rows: Record<string, unknown>[],
  ownerUserIds?: Set<string>,
): Record<string, unknown>[] {
  if (tableName === "roles") {
    return rows.filter((r) => r.key !== "owner");
  }

  if (!ownerUserIds || ownerUserIds.size === 0) {
    return rows;
  }

  if (tableName === "profiles") {
    return rows.filter((r) => !ownerUserIds.has(r.id as string));
  }

  if (tableName === "user_role_assignments") {
    return rows.filter((r) => !ownerUserIds.has(r.user_id as string));
  }

  return rows;
}
