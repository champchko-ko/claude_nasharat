import { canRegisterAchievement } from "./canRegisterAchievement";
import { getCurrentSchool } from "@/lib/school/getCurrentSchool";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";

export async function assertCanRegisterAchievement(
  profile: { id: string; school_id: string | null; department_id: string | null } | null,
  targetDepartmentId?: string | null,
): Promise<{ schoolId: string; profileId: string }> {
  if (!profile) {
    throw new ForbiddenError("Unauthorized");
  }

  const school = await getCurrentSchool(profile.school_id);
  if (!school) {
    throw new ForbiddenError("No school associated with profile");
  }

  const isAuthorized = await canRegisterAchievement(
    school.id,
    profile.department_id,
    targetDepartmentId ?? null,
    profile.id,
  );

  if (!isAuthorized) {
    throw new ForbiddenError("Unauthorized");
  }

  return { schoolId: school.id, profileId: profile.id };
}
