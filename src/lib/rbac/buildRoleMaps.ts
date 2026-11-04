export type RolePermItem = {
  role_id: string;
  permission_key: string;
};

export type RoleAssignmentItem = {
  role_id: string;
};

export function buildRoleMaps(perms: RolePermItem[], assignments: RoleAssignmentItem[]) {
  const permsMap = new Map<string, string[]>();
  for (const p of perms) {
    const list = permsMap.get(p.role_id) ?? [];
    list.push(p.permission_key);
    permsMap.set(p.role_id, list);
  }

  const countMap = new Map<string, number>();
  for (const a of assignments) {
    countMap.set(a.role_id, (countMap.get(a.role_id) ?? 0) + 1);
  }

  return { permsMap, countMap };
}
