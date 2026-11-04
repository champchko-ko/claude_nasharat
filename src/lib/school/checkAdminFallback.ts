import type { SupabaseClient } from "@supabase/supabase-js";
import { ConflictError } from "@/lib/errors/ConflictError";
import { verifyOtherActiveSchoolAdminsExist } from "./verifyOtherActiveSchoolAdminsExist";

export async function checkAdminFallback(
  adminClient: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: targetProfile } = await adminClient
    .from("profiles")
    .select("school_id, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!targetProfile?.school_id || !targetProfile.is_active) {
    return;
  }

  const hasOthers = await verifyOtherActiveSchoolAdminsExist(
    adminClient,
    userId,
    targetProfile.school_id,
  );
  if (!hasOthers) {
    throw new ConflictError(
      "Cannot deactivate the last active school administrator. Assign another administrator first.",
    );
  }
}
