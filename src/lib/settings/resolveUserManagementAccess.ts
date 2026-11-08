import type { ProfileRow } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { hasPermission } from "@/lib/rbac/hasPermission";

export type UserManagementAccess = {
  isPlatformOwner: boolean;
  /**
   * @deprecated There is one school, so there is no school id to resolve. Always
   * `null`; kept only so existing call sites keep compiling.
   */
  schoolId: string | null;
  canManageUsers: boolean;
  canManageRoles: boolean;
};

/**
 * What the signed-in user may do on the Users and Roles screen.
 *
 * - Managing users needs `users.manage`; the owner holds every permission.
 * - Managing roles and their permissions is the owner's alone.
 */
export async function resolveUserManagementAccess(
  profile: ProfileRow | null,
): Promise<UserManagementAccess> {
  if (!profile) {
    return {
      isPlatformOwner: false,
      schoolId: null,
      canManageUsers: false,
      canManageRoles: false,
    };
  }

  const owner = await isPlatformOwner(profile.id);
  const canManageUsers = owner || (await hasPermission("users.manage").catch(() => false));

  return { isPlatformOwner: owner, schoolId: null, canManageUsers, canManageRoles: owner };
}
