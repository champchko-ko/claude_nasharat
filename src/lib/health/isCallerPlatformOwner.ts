import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";

export async function isCallerPlatformOwner(): Promise<boolean> {
  try {
    const profile = await getCurrentProfile();
    if (!profile?.id) {
      return false;
    }
    return Boolean(await isPlatformOwner(profile.id));
  } catch {
    return false;
  }
}
