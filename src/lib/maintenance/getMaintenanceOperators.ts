import { getSchoolUsers, type SchoolUserRow } from "@/lib/school/getSchoolUsers";

export async function getMaintenanceOperators(schoolId?: string | null): Promise<SchoolUserRow[]> {
  const users = await getSchoolUsers(schoolId);
  return users.filter((u) => u.is_active && u.role_key === "operator");
}
