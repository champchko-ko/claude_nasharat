type RoleAssignment = {
  roles: { key: string; name: string } | null;
};

export function resolveUserRoleKey(assignments?: RoleAssignment[] | null): string | null {
  if (!assignments || assignments.length === 0) return null;

  for (const a of assignments) {
    if (a.roles?.key && a.roles.key !== "owner") {
      return a.roles.key;
    }
  }

  return assignments[0]?.roles?.key ?? null;
}
