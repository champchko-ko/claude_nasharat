import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { NotFoundError } from "@/lib/errors/NotFoundError";

export type RoleForAssignment = {
  id: string;
  isSystem: boolean;
  requiresDepartment: boolean;
};

export async function resolveRoleForAssignment(
  supabase: SupabaseClient,
  roleKey: string,
): Promise<RoleForAssignment> {
  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id, is_system, requires_department")
    .eq("key", roleKey)
    .maybeSingle();

  if (roleError) {
    throw mapDatabaseError(roleError, `Failed to resolve role '${roleKey}'`);
  }

  if (!role) {
    throw new NotFoundError(`Role '${roleKey}' was not found`);
  }

  return {
    id: role.id as string,
    isSystem: Boolean(role.is_system),
    requiresDepartment: Boolean(role.requires_department),
  };
}
