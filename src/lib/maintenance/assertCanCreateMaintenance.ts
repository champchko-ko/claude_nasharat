import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";

export async function assertCanCreateMaintenance(): Promise<{
  schoolId: string;
  profileId: string;
  departmentId: string | null;
}> {
  const profile = await getCurrentProfile();
  if (!profile?.school_id) {
    throw new AuthenticationError("No school associated with profile");
  }

  const allowed = await hasPermission(
    "maintenance.create",
    profile.school_id,
    profile.department_id,
  );
  if (!allowed) {
    throw new ForbiddenError("Unauthorized");
  }

  return {
    schoolId: profile.school_id,
    profileId: profile.id,
    departmentId: profile.department_id,
  };
}
