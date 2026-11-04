import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { getFirstActiveSchoolId } from "./getFirstActiveSchoolId";

export async function resolveSchoolForCaller(
  profile: { id: string; school_id?: string | null } | null,
): Promise<string | null> {
  if (profile?.school_id) {
    return profile.school_id;
  }
  if (!profile) {
    return null;
  }

  const isOwner = await isPlatformOwner(profile.id);
  if (isOwner) {
    return getFirstActiveSchoolId();
  }

  return null;
}
