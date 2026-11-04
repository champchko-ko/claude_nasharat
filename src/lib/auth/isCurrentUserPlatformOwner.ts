import { isPlatformOwner } from "./isPlatformOwner";

/**
 * `isPlatformOwner` requires a user id; pages usually have an optional profile.
 * Kept in one place so the "no profile means no owner" rule is not re-implemented
 * as a ternary at every call site (which also keeps page complexity down).
 */
export async function isCurrentUserPlatformOwner(profileId?: string | null): Promise<boolean> {
  if (!profileId) return false;
  return isPlatformOwner(profileId);
}
