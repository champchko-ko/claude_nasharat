import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { assertCallerCanManageSchoolUsers } from "./assertCallerCanManageSchoolUsers";
import { verifyManageTargetUser } from "./verifyManageTargetUser";

export type ManageUserPermissionResult = {
  allowed: boolean;
  currentUserId?: string;
  error?: string;
};

/**
 * Authorises a mutation on `targetUserId`.
 *
 * The caller must hold `users.manage` (the owner holds every permission) and
 * the target must exist and must not be a protected (owner) account. The owner
 * role can only be chosen by the owner.
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
    .select("id")
    .eq("id", targetUserId)
    .maybeSingle();

  if (error) {
    return { allowed: false, error: "Failed to load the target user" };
  }

  const targetCheck = await verifyManageTargetUser(target, callerCheck.isOwner, targetRoleKey);
  if (!targetCheck.allowed) {
    return { allowed: false, error: targetCheck.error };
  }

  return { allowed: true, currentUserId: profile.id };
}
