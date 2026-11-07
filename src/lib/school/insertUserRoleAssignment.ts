import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export async function insertUserRoleAssignment(
  supabase: SupabaseClient,
  params: {
    userId: string;
    roleId: string;
    assignedBy: string;
    departmentId: string | null | undefined;
  },
): Promise<void> {
  const { error } = await supabase.from("user_role_assignments").insert({
    user_id: params.userId,
    role_id: params.roleId,
    department_id: params.departmentId || null,
    assigned_by: params.assignedBy,
  });

  if (error) {
    throw mapDatabaseError(error, "Failed to insert user role assignment");
  }
}
