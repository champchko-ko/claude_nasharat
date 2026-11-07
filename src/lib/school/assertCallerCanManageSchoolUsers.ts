import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { hasPermission } from "@/lib/rbac/hasPermission";
import type { ProfileRow } from "@/lib/auth/getCurrentProfile";

export async function assertCallerCanManageSchoolUsers(
  profile: ProfileRow,
): Promise<{ allowed: boolean; isOwner: boolean; error?: string }> {
  const isOwner = await isPlatformOwner(profile.id);
  if (isOwner) {
    return { allowed: true, isOwner: true };
  }

  const permitted = await hasPermission("users.manage");
  if (permitted) {
    return { allowed: true, isOwner: false };
  }

  return { allowed: false, isOwner: false, error: "Unauthorized" };
}
