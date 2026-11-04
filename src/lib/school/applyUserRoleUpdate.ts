import { createSupabaseServerClient } from "@/lib/supabase";
import { assignUserRole } from "./assignUserRole";

export async function applyUserRoleUpdate(
  userId: string,
  schoolId: string,
  callerId: string,
  roleKey?: string | null,
  departmentId?: string | null,
): Promise<void> {
  if (!roleKey) return;

  const supabase = await createSupabaseServerClient();
  await assignUserRole(supabase, userId, schoolId, callerId, roleKey, departmentId);
}
