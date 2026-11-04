import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export async function assertCanDeleteRoleRecord(
  supabase: SupabaseClient,
  roleId: string,
  schoolId: string | null,
  isOwner = false,
): Promise<{ allowed: boolean; error?: string }> {
  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id, key, is_system, school_id")
    .eq("id", roleId)
    .maybeSingle();

  if (roleError) {
    throw mapDatabaseError(roleError);
  }

  if (!role) {
    return { allowed: false, error: "Role not found" };
  }

  if (!isOwner) {
    return { allowed: false, error: "Only the platform owner can delete roles" };
  }

  // Protect platform owner role from accidental deletion
  if (role.key === "owner") {
    return { allowed: false, error: "Cannot delete the platform owner role" };
  }

  const { data: assignments, error: assignError } = await supabase
    .from("user_role_assignments")
    .select("id")
    .eq("role_id", roleId)
    .limit(1);

  if (assignError) {
    throw mapDatabaseError(assignError);
  }

  if (assignments && assignments.length > 0) {
    return {
      allowed: false,
      error:
        "Cannot delete role assigned to active users. Please reassign or delete assigned users first.",
    };
  }

  return { allowed: true };
}
