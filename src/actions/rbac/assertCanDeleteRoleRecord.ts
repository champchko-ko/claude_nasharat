import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { getRoleDeletionBlocker } from "./getRoleDeletionBlocker";

/**
 * Only the owner deletes roles, and only custom roles with no users.
 * System roles and the locked owner role are permanent. The database enforces
 * the same rules; this check returns a friendly message first.
 */
export async function assertCanDeleteRoleRecord(
  supabase: SupabaseClient,
  roleId: string,
  isOwner = false,
): Promise<{ allowed: boolean; error?: string }> {
  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id, key, is_system, is_locked")
    .eq("id", roleId)
    .maybeSingle();

  if (roleError) {
    throw mapDatabaseError(roleError);
  }

  const blocker = getRoleDeletionBlocker(role, isOwner);
  if (blocker) {
    return { allowed: false, error: blocker };
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
