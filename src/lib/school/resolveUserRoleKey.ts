type RoleAssignment = {
  roles: { key: string } | null;
};

function normalizeAssignments(
  assignments?: RoleAssignment | RoleAssignment[] | null,
): RoleAssignment[] {
  if (Array.isArray(assignments)) return assignments;
  if (assignments) return [assignments];
  return [];
}

export function resolveUserRoleKey(
  assignments?: RoleAssignment | RoleAssignment[] | null,
): string | null {
  const normalized = normalizeAssignments(assignments);
  if (normalized.length === 0) return null;

  for (const a of normalized) {
    if (a.roles?.key && a.roles.key !== "owner") {
      return a.roles.key;
    }
  }

  return normalized[0]?.roles?.key ?? null;
}
