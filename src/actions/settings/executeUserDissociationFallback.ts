import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyTargetDeletable } from "./verifyTargetDeletable";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export async function executeUserDissociationFallback(
  admin: SupabaseClient,
  userId: string,
  isOwner: boolean,
  callerSchoolId: string | null,
): Promise<void> {
  await verifyTargetDeletable(admin, userId, isOwner, callerSchoolId);

  // 1. Remove user role assignments
  await admin.from("user_role_assignments").delete().eq("user_id", userId);

  // 2. Clean up non-cascading foreign keys
  await admin.from("circular_responses").delete().eq("responder_id", userId);
  await admin.from("maintenance_assignments").delete().eq("operator_id", userId);
  await admin
    .from("maintenance_requests")
    .update({ assigned_operator_id: null })
    .eq("assigned_operator_id", userId);

  // 3. Delete from public.profiles
  const { error: profileDeleteError } = await admin
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileDeleteError) {
    throw mapDatabaseError(profileDeleteError);
  }

  // 4. Delete from auth.users via admin API
  if (admin.auth?.admin?.deleteUser) {
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError && (authError as { status?: number }).status !== 404) {
      throw mapDatabaseError(authError);
    }
  }
}
