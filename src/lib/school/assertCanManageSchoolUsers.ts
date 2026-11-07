import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";

export async function assertCanManageSchoolUsers(): Promise<{
  profileId: string;
}> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new AuthenticationError("Authentication required");
  }

  const allowed = await hasPermission("users.manage");
  if (!allowed) {
    throw new ForbiddenError("Unauthorized");
  }

  return { profileId: profile.id };
}
