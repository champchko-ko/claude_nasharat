import type { SupabaseClient } from "@supabase/supabase-js";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

/**
 * Only the owner edits roles and their permissions, system roles included.
 * The owner role itself is locked and can never be edited.
 * Returns whether the role is a system role (system role names are not edited).
 */
export async function assertCanUpdateRoleRecord(
  supabase: SupabaseClient,
  roleId: string,
  isOwner = false,
): Promise<{ isSystem: boolean }> {
  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id, is_system, is_locked")
    .eq("id", roleId)
    .maybeSingle();

  if (roleError) {
    throw mapDatabaseError(roleError);
  }

  if (!role) {
    throw new ForbiddenError("Role not found");
  }

  if (!isOwner) {
    throw new ForbiddenError("Only the owner can modify roles");
  }

  if (role.is_locked) {
    throw new ForbiddenError("The owner role is locked and cannot be modified");
  }

  return { isSystem: Boolean(role.is_system) };
}
