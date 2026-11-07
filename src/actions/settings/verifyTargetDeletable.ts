import type { SupabaseClient } from "@supabase/supabase-js";
import { assertNotLastActiveSchoolAdmin } from "@/lib/school/assertNotLastActiveSchoolAdmin";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { NotFoundError } from "@/lib/errors/NotFoundError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export async function verifyTargetDeletable(
  admin: SupabaseClient,
  userId: string,
  isOwner: boolean,
  callerSchoolId: string | null,
): Promise<void> {
  const { data: targetProfile, error: targetError } = await admin
    .from("profiles")
    .select("id, school_id, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (targetError) {
    throw mapDatabaseError(targetError);
  }
  if (!targetProfile) {
    throw new NotFoundError("User not found in this school");
  }

  if (!isOwner && targetProfile.school_id !== callerSchoolId) {
    throw new ForbiddenError("Unauthorized");
  }

  if (!isOwner && targetProfile.is_active) {
    await assertNotLastActiveSchoolAdmin(admin, userId);
  }
}

