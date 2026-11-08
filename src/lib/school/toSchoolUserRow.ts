import type { RawProfileQueryResult, MappedSchoolUser } from "./mapSchoolUserRows";
import { resolveUserRoleKey } from "./resolveUserRoleKey";

export function toSchoolUserRow(
  row: RawProfileQueryResult,
  explicitIsOwner?: boolean,
): MappedSchoolUser {
  const assignments = Array.isArray(row.user_role_assignments)
    ? row.user_role_assignments
    : row.user_role_assignments
      ? [row.user_role_assignments]
      : [];
  const isOwner =
    explicitIsOwner ?? Boolean(assignments.some((a) => a.roles?.key === "owner"));
  const deptName = row.departments?.name_ar ?? row.departments?.name_en ?? null;

  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone ?? null,
    job_title: row.job_title,
    department_id: row.department_id,
    department_name: deptName,
    is_active: row.is_active,
    role_key: resolveUserRoleKey(assignments),
    is_owner: isOwner,
  };
}
