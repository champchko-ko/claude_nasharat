import { getCurrentProfile, type ProfileRow } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { resolveSchoolForCaller } from "@/lib/school/resolveSchoolForCaller";
import { getEffectivePermissions } from "@/lib/rbac/getEffectivePermissions";

export type AssertCanViewReportsResult =
  | { authorized: false; error: string }
  | {
      authorized: true;
      profile: ProfileRow;
      schoolId: string;
      scopedDepartmentId: string | null;
    };

export async function assertCanViewReports(): Promise<AssertCanViewReportsResult> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { authorized: false, error: "Unauthorized" };
  }

  const schoolId = await resolveSchoolForCaller(profile);
  if (!schoolId) {
    return { authorized: false, error: "No school associated with profile" };
  }

  const perms = await getEffectivePermissions(schoolId);
  const isOwner = await isPlatformOwner(profile.id);
  const isManager =
    perms.includes("settings.school.update") ||
    perms.includes("users.manage") ||
    perms.includes("audit.view") ||
    perms.includes("school.manage");

  if (isOwner || isManager) {
    return {
      authorized: true,
      profile,
      schoolId,
      scopedDepartmentId: null,
    };
  }

  if (perms.includes("reports.view") && profile.department_id) {
    return {
      authorized: true,
      profile,
      schoolId,
      scopedDepartmentId: profile.department_id,
    };
  }

  return { authorized: false, error: "Unauthorized" };
}
