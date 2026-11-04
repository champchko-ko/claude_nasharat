import type { ProfileRow } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { getFirstActiveSchoolId } from "@/lib/school/getFirstActiveSchoolId";

export type UserManagementAccess = {
  isPlatformOwner: boolean;
  schoolId: string | null;
  canManageUsers: boolean;
  canManageRoles: boolean;
};

/**
 * Splits the old combined "owner" gate into the two permissions it was
 * conflating (audit findings H-10 and M-36).
 *
 * `roles.manage` keeps the role catalog (no feature is removed), but it no
 * longer implies `users.manage` or platform ownership. A school admin holds
 * both permissions and is unaffected; a custom role with only `roles.manage`
 * sees the Roles tab and no user mutations.
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
  // The owner has no school of their own; the manual requires them to manage
  // the first school's administrators. This resolution is owner-only, unlike
  // the old service-role fallback inside getSchoolUsers.
  const schoolId = profile.school_id ?? (owner ? await getFirstActiveSchoolId() : null);

  const [canManageUsers] = await Promise.all([
    owner || (schoolId ? hasPermission("users.manage", schoolId).catch(() => false) : false),
  ]);

  // Only the platform owner can view and manage roles and permissions
  const canManageRoles = owner;

  return { isPlatformOwner: owner, schoolId, canManageUsers, canManageRoles };
}
