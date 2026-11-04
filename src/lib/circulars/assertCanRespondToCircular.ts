import type { ProfileRow } from "@/lib/auth/getCurrentProfile";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { hasPermission } from "@/lib/rbac/hasPermission";

export async function assertCanRespondToCircular(
  profile: ProfileRow | null,
): Promise<{ schoolId: string; departmentId: string }> {
  if (!profile?.school_id || !profile.department_id) {
    throw new AuthenticationError("Must belong to a department to respond");
  }

  const allowed = await hasPermission("circular.respond", profile.school_id, profile.department_id);
  if (!allowed) {
    throw new ForbiddenError("Unauthorized");
  }

  return { schoolId: profile.school_id, departmentId: profile.department_id };
}
