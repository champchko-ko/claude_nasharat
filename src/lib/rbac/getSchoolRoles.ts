import { createSupabaseAdminClient } from "@/lib/supabase";
import { buildRoleMaps } from "./buildRoleMaps";

export type SchoolRoleRow = {
  id: string;
  key: string;
  name: string;
  school_id: string | null;
  is_system: boolean;
  permissions: string[];
  user_count: number;
  created_at: string;
};

export async function getSchoolRoles(schoolId?: string | null): Promise<SchoolRoleRow[]> {
  const admin = createSupabaseAdminClient();

  let query = admin
    .from("roles")
    .select("id, key, name, school_id, is_system, created_at")
    .neq("key", "owner")
    .order("is_system", { ascending: false })
    .order("name", { ascending: true });

  if (schoolId) {
    query = query.or(`school_id.eq.${schoolId},is_system.eq.true`);
  } else {
    query = query.eq("is_system", true);
  }

  const { data: roles, error } = await query;
  if (error || !roles || roles.length === 0) return [];

  const roleIds = roles.map((r) => r.id);

  const [{ data: perms }, { data: assignments }] = await Promise.all([
    admin.from("role_permissions").select("role_id, permission_key").in("role_id", roleIds),
    schoolId
      ? admin.from("user_role_assignments").select("role_id").eq("school_id", schoolId)
      : Promise.resolve({ data: [] }),
  ]);

  const { permsMap, countMap } = buildRoleMaps(perms ?? [], assignments ?? []);

  return roles.map((r) => ({
    ...r,
    permissions: permsMap.get(r.id) ?? [],
    user_count: countMap.get(r.id) ?? 0,
  }));
}
