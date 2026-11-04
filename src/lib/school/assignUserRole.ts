import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { resolveRoleForAssignment } from "./resolveRoleForAssignment";

export async function assignUserRole(
  supabase: SupabaseClient,
  userId: string,
  schoolId: string,
  assignedBy: string,
  roleKey: string,
  departmentId?: string | null,
): Promise<void> {
  const roleId = await resolveRoleForAssignment(supabase, roleKey, schoolId);
  const isSchoolWide = ["school_admin", "operator", "auditor", "owner"].includes(roleKey);
  const effectiveDeptId = isSchoolWide ? null : departmentId;

  const { data: existingAssignment, error: findError } = await supabase
    .from("user_role_assignments")
    .select("id")
    .eq("user_id", userId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (findError) {
    throw mapDatabaseError(findError, "Failed to check existing role assignment");
  }

  if (existingAssignment) {
    const updatePayload: { role_id: string; assigned_by: string; department_id?: string | null } = {
      role_id: roleId,
      assigned_by: assignedBy,
    };
    if (effectiveDeptId !== undefined) {
      updatePayload.department_id = effectiveDeptId || null;
    }

    const { error: updateError } = await supabase
      .from("user_role_assignments")
      .update(updatePayload)
      .eq("id", existingAssignment.id);

    if (updateError) {
      throw mapDatabaseError(updateError, "Failed to update user role assignment");
    }
  } else {
    const { error: insertError } = await supabase.from("user_role_assignments").insert({
      user_id: userId,
      role_id: roleId,
      school_id: schoolId,
      department_id: effectiveDeptId || null,
      assigned_by: assignedBy,
    });

    if (insertError) {
      throw mapDatabaseError(insertError, "Failed to insert user role assignment");
    }
  }
}
