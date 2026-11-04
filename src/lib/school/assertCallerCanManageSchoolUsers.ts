import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { hasPermission } from "@/lib/rbac/hasPermission";
import type { ProfileRow } from "@/lib/auth/getCurrentProfile";

export async function assertCallerCanManageSchoolUsers(
  profile: ProfileRow,
): Promise<{ allowed: boolean; isOwner: boolean; error?: string }> {
  if (profile.school_id) {
    const permitted = await hasPermission("users.manage", profile.school_id);
    if (permitted) {
      return { allowed: true, isOwner: false };
    }
  }

  const isOwner = await isPlatformOwner(profile.id);
  if (isOwner) {
    return { allowed: true, isOwner: true };
  }

  if (!profile.school_id) {
    return { allowed: false, isOwner: false, error: "No school associated with profile" };
  }

  return { allowed: false, isOwner: false, error: "Unauthorized" };
}
