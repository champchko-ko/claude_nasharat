import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { ValidationError } from "@/lib/errors/ValidationError";
import { insertUserRoleAssignment } from "./insertUserRoleAssignment";
import { resolveAssignmentDepartment } from "./resolveAssignmentDepartment";
import { resolveRoleForAssignment } from "./resolveRoleForAssignment";
import { updateUserRoleAssignment } from "./updateUserRoleAssignment";

/**
 * Gives a user their (single) role. Which department the assignment carries is
 * decided by `resolveAssignmentDepartment`.
 */
export async function assignUserRole(
  supabase: SupabaseClient,
  userId: string,
  assignedBy: string,
  roleKey: string,
  departmentId?: string | null,
): Promise<void> {
  const role = await resolveRoleForAssignment(supabase, roleKey);
  const effectiveDeptId = resolveAssignmentDepartment(role, departmentId);

  const { data: existingAssignment, error: findError } = await supabase
    .from("user_role_assignments")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (findError) {
    throw mapDatabaseError(findError, "Failed to check existing role assignment");
  }

  if (existingAssignment) {
    await updateUserRoleAssignment(
      supabase,
      existingAssignment.id,
      role.id,
      assignedBy,
      effectiveDeptId,
    );
    return;
  }

  if (role.requiresDepartment && !effectiveDeptId) {
    throw new ValidationError("This role requires a department");
  }

  await insertUserRoleAssignment(supabase, {
    userId,
    roleId: role.id,
    assignedBy,
    departmentId: effectiveDeptId,
  });
}
