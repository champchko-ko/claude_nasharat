import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";

export async function assertCanAssignMaintenance(): Promise<{
  schoolId: string;
  profileId: string;
}> {
  const profile = await getCurrentProfile();
  if (!profile?.school_id) {
    throw new AuthenticationError("No school associated with profile");
  }

  const allowed = await hasPermission(
    "maintenance.assign",
    profile.school_id,
    profile.department_id,
  );
  if (!allowed) {
    throw new ForbiddenError("Unauthorized");
  }

  return { schoolId: profile.school_id, profileId: profile.id };
}
