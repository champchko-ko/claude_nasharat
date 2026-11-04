import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { resolveSchoolForCaller } from "@/lib/school/resolveSchoolForCaller";
import { getEffectivePermissions } from "@/lib/rbac/getEffectivePermissions";

export type ManageCircularAuthResult =
  | {
      authorized: true;
      profileId: string;
      schoolId: string;
      isOwner: boolean;
      error?: never;
    }
  | {
      authorized: false;
      error: string;
      profileId?: never;
      schoolId?: never;
      isOwner?: never;
    };

export async function assertCanManageCirculars(): Promise<ManageCircularAuthResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { authorized: false, error: "Unauthorized" };

  const schoolId = await resolveSchoolForCaller(profile);
  if (!schoolId) return { authorized: false, error: "No school associated with profile" };

  const perms = await getEffectivePermissions(schoolId);
  const isOwner = await isPlatformOwner(profile.id);
  const canManage =
    isOwner || perms.includes("circular.create") || perms.includes("circular.publish");
  if (!canManage) return { authorized: false, error: "Unauthorized" };

  return { authorized: true, profileId: profile.id, schoolId, isOwner };
}
