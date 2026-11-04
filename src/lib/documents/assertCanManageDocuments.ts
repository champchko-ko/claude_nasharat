import { getCurrentProfile, type ProfileRow } from "@/lib/auth/getCurrentProfile";
import { resolveSchoolForCaller } from "@/lib/school/resolveSchoolForCaller";
import { getEffectivePermissions } from "@/lib/rbac/getEffectivePermissions";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";

export type ManageDocumentsAccessResult = {
  allowed: boolean;
  profile: ProfileRow | null;
  schoolId: string | null;
  isOwner: boolean;
};

export async function assertCanManageDocuments(): Promise<ManageDocumentsAccessResult> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) {
    return { allowed: false, profile: null, schoolId: null, isOwner: false };
  }

  const schoolId = await resolveSchoolForCaller(profile);
  const [permissions, isOwner] = await Promise.all([
    getEffectivePermissions(schoolId).catch(() => []),
    isPlatformOwner(profile.id),
  ]);

  const isManager =
    isOwner ||
    permissions.some(
      (p) =>
        p.startsWith("settings.") ||
        p === "users.manage" ||
        p === "roles.manage" ||
        p === "audit.view" ||
        p === "school.manage",
    ) ||
    !profile.school_id;

  return {
    allowed: isManager,
    profile,
    schoolId,
    isOwner,
  };
}
