import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { assertCallerCanManageSchoolUsers } from "./assertCallerCanManageSchoolUsers";
import { verifyManageTargetUser } from "./verifyManageTargetUser";

export type ManageUserPermissionResult = {
  allowed: boolean;
  schoolId?: string;
  currentUserId?: string;
  error?: string;
};

/**
 * Authorises a mutation on `targetUserId`.
 *
 * Both sides are checked: the caller must hold `users.manage` in their own
 * school AND the target must belong to that same school. Without the second
 * check a manager could pass a foreign user id to `updateUserAction`, which
 * then rewrote that user's email and password through the service-role client
 * (audit finding C-1).
 */
export async function assertCanManageUser(
  targetUserId: string,
  targetRoleKey?: string | null,
): Promise<ManageUserPermissionResult> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { allowed: false, error: "Authentication required" };
  }

  const callerCheck = await assertCallerCanManageSchoolUsers(profile);
  if (!callerCheck.allowed) {
    return { allowed: false, error: callerCheck.error };
  }

  const supabase = await createSupabaseServerClient();
  const { data: target, error } = await supabase
    .from("profiles")
    .select("id, school_id")
    .eq("id", targetUserId)
    .maybeSingle();

  if (error) {
    return { allowed: false, error: "Failed to load the target user" };
  }

  const targetCheck = await verifyManageTargetUser(
    target,
    profile.school_id,
    callerCheck.isOwner,
    targetRoleKey,
  );
  if (!targetCheck.allowed) {
    return { allowed: false, error: targetCheck.error };
  }

  const effectiveSchoolId = target?.school_id ?? profile.school_id;
  return { allowed: true, schoolId: effectiveSchoolId ?? undefined, currentUserId: profile.id };
}
