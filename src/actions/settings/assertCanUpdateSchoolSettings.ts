import { isCurrentUserPlatformOwner } from "@/lib/auth/isCurrentUserPlatformOwner";
import { getFirstActiveSchoolId } from "@/lib/school/getFirstActiveSchoolId";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { ValidationError } from "@/lib/errors/ValidationError";
import type { ProfileRow } from "@/lib/auth/getCurrentProfile";

export async function assertCanUpdateSchoolSettings(
  profile: ProfileRow,
  formSchoolId?: string | null,
): Promise<string> {
  const isOwner = await isCurrentUserPlatformOwner(profile.id);
  const targetSchoolId = profile.school_id ?? formSchoolId ?? (await getFirstActiveSchoolId());

  if (!targetSchoolId) {
    throw new ValidationError("No target school specified");
  }

  if (isOwner) {
    return targetSchoolId;
  }

  if (profile.school_id && formSchoolId && profile.school_id !== formSchoolId) {
    throw new ForbiddenError("Cannot manage a different school");
  }

  const allowed = await hasPermission("settings.school.update", targetSchoolId);
  if (!allowed) {
    throw new ForbiddenError("Unauthorized");
  }

  return targetSchoolId;
}
