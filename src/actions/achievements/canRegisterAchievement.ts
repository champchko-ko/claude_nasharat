import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";

/**
 * Checks whether a user can register/manage school achievements.
 * Currently restricted to platform owners ONLY per system requirements.
 * In a future phase, this will be expanded to allow managers granted
 * explicit achievement/calendar permissions by the owner.
 */
export async function canRegisterAchievement(
  _schoolId: string | null | undefined,
  _userDeptId: string | null | undefined,
  _targetDeptId: string | null,
  userId?: string | null,
): Promise<boolean> {
  if (!userId) return false;
  return isPlatformOwner(userId);
}
