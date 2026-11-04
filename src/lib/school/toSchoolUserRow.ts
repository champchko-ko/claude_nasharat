import type { RawProfileQueryResult, MappedSchoolUser } from "./mapSchoolUserRows";
import { resolveUserRoleKey } from "./resolveUserRoleKey";

export function toSchoolUserRow(
  row: RawProfileQueryResult,
  explicitIsOwner?: boolean,
): MappedSchoolUser {
  const isOwner =
    explicitIsOwner ?? Boolean(row.user_role_assignments?.some((a) => a.roles?.key === "owner"));
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
    role_key: resolveUserRoleKey(row.user_role_assignments),
    is_owner: isOwner,
  };
}
