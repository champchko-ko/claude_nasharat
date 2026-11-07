import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export async function updateUserRoleAssignment(
  supabase: SupabaseClient,
  assignmentId: string,
  roleId: string,
  assignedBy: string,
  departmentId: string | null | undefined,
): Promise<void> {
  const updatePayload: { role_id: string; assigned_by: string; department_id?: string | null } = {
    role_id: roleId,
    assigned_by: assignedBy,
  };
  if (departmentId !== undefined) {
    updatePayload.department_id = departmentId || null;
  }

  const { error } = await supabase
    .from("user_role_assignments")
    .update(updatePayload)
    .eq("id", assignmentId);

  if (error) {
    throw mapDatabaseError(error, "Failed to update user role assignment");
  }
}
