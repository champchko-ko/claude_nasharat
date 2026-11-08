import { createSupabaseAdminClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { buildRoleMaps } from "./buildRoleMaps";

export type SchoolRoleRow = {
  id: string;
  key: string;
  /** Display name used by the existing screens (the Arabic name). */
  name: string;
  name_ar: string;
  name_en: string;
  is_system: boolean;
  is_locked: boolean;
  requires_department: boolean;
  permissions: string[];
  user_count: number;
  created_at: string;
};

type RoleRecord = Omit<SchoolRoleRow, "name" | "permissions" | "user_count">;

async function loadRoles(): Promise<SchoolRoleRow[]> {
  const admin = createSupabaseAdminClient();

  // The owner role is never listed: it is hidden from everyone and cannot be edited.
  const { data: roles, error } = await admin
    .from("roles")
    .select("id, key, name_ar, name_en, is_system, is_locked, requires_department, created_at")
    .neq("key", "owner")
    .order("is_system", { ascending: false })
    .order("name_ar", { ascending: true });

  if (error) throw mapDatabaseError(error, "Failed to load roles");
  if (!roles || roles.length === 0) return [];

  const [permsResult, assignmentsResult] = await Promise.all([
    admin
      .from("role_permissions")
      .select("role_id, permission_key")
      .in(
        "role_id",
        roles.map((r: { id: string }) => r.id),
      ),
    admin.from("user_role_assignments").select("role_id"),
  ]);

  if (permsResult.error) throw mapDatabaseError(permsResult.error, "Failed to load role permissions");
  if (assignmentsResult.error) {
    throw mapDatabaseError(assignmentsResult.error, "Failed to count role assignments");
  }

  const { permsMap, countMap } = buildRoleMaps(
    permsResult.data ?? [],
    assignmentsResult.data ?? [],
  );

  return roles.map((r: RoleRecord) => ({
    ...r,
    name: r.name_ar,
    permissions: permsMap.get(r.id) ?? [],
    user_count: countMap.get(r.id) ?? 0,
  }));
}

/**
 * All roles except the hidden owner role, with their permissions and user counts.
 *
 * The optional argument is retained for compatibility with older callers and
 * is ignored: there is one school and one set of roles.
 */
export const getSchoolRoles: (legacySchoolId?: string | null) => Promise<SchoolRoleRow[]> =
  loadRoles;
