import { getCurrentProfile, type ProfileRow } from "@/lib/auth/getCurrentProfile";
import { getEffectivePermissions } from "@/lib/rbac/getEffectivePermissions";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";

export type SettingsAccessResult = {
  allowed: boolean;
  profile: ProfileRow | null;
  permissions: string[];
  isOwner: boolean;
};

export async function assertCanAccessSettings(): Promise<SettingsAccessResult> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { allowed: false, profile: null, permissions: [], isOwner: false };
  }

  const [permissions, isOwner] = await Promise.all([
    getEffectivePermissions(profile.school_id),
    isPlatformOwner(profile.id),
  ]);

  const hasSettingsPerm =
    isOwner ||
    permissions.some(
      (p) =>
        p.startsWith("settings.") ||
        p === "users.manage" ||
        p === "roles.manage" ||
        p === "audit.view",
    );

  return {
    allowed: hasSettingsPerm,
    profile,
    permissions,
    isOwner,
  };
}
