import { getCurrentProfile, type ProfileRow } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { hasPermission } from "@/lib/rbac/hasPermission";

export type AssertCanViewAuditResult =
  | { authorized: false; error: string }
  | {
      authorized: true;
      profile: ProfileRow;
      schoolId: string | null;
      isOwner: boolean;
    };

export async function assertCanViewAudit(): Promise<AssertCanViewAuditResult> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { authorized: false, error: "Unauthorized" };
  }

  const isOwner = await isPlatformOwner(profile.id);
  if (isOwner) {
    return {
      authorized: true,
      profile,
      schoolId: profile.school_id ?? null,
      isOwner: true,
    };
  }

  if (!profile.school_id) {
    return { authorized: false, error: "No school associated with profile" };
  }

  const allowed = await hasPermission("audit.view", profile.school_id);
  if (!allowed) {
    return { authorized: false, error: "Forbidden" };
  }

  return {
    authorized: true,
    profile,
    schoolId: profile.school_id,
    isOwner: false,
  };
}
