import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";

export async function assertCanManageCalendar(): Promise<{
  schoolId: string;
  profileId: string;
}> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new AuthenticationError("No school associated with profile");
  }

  const allowed = await hasPermission("calendar.manage");
  if (!allowed) {
    throw new ForbiddenError("Unauthorized");
  }

  return { schoolId: "singleton", profileId: profile.id };
}
