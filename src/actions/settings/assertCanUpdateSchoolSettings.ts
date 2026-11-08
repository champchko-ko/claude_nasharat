import { isCurrentUserPlatformOwner } from "@/lib/auth/isCurrentUserPlatformOwner";
import { getFirstActiveSchoolId } from "@/lib/school/getFirstActiveSchoolId";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { ValidationError } from "@/lib/errors/ValidationError";
import type { ProfileRow } from "@/lib/auth/getCurrentProfile";

export async function assertCanUpdateSchoolSettings(
  profile: ProfileRow,
  _formSchoolId?: string | null,
): Promise<string> {
  void _formSchoolId;
  const isOwner = await isCurrentUserPlatformOwner(profile.id);
  const targetSchoolId = await getFirstActiveSchoolId();

  if (!targetSchoolId) {
    throw new ValidationError("No target school specified");
  }

  if (isOwner) {
    return targetSchoolId;
  }

  const allowed = await hasPermission("settings.school.update");
  if (!allowed) {
    throw new ForbiddenError("Unauthorized");
  }

  return targetSchoolId;
}
