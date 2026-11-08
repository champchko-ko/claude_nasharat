import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";

export async function verifyManageTargetUser(
  target: { id: string } | null,
  isCallerOwner: boolean,
  targetRoleKey?: string | null,
): Promise<{ allowed: boolean; error?: string }> {
  if (!target) {
    return { allowed: false, error: "User not found" };
  }

  if (await isPlatformOwner(target.id)) {
    return { allowed: false, error: "Cannot modify system-protected account" };
  }

  if (!isCallerOwner && targetRoleKey === "owner") {
    return { allowed: false, error: "Invalid role selection" };
  }

  return { allowed: true };
}
