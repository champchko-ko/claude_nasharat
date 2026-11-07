import { hasPermission } from "@/lib/rbac/hasPermission";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { ValidationError } from "@/lib/errors/ValidationError";

export async function assertCanToggleUserActive(
  callerId: string,
  targetUserId: string,
  isOwner: boolean,
  isTargetOwner: boolean,
): Promise<void> {
  if (callerId === targetUserId) {
    throw new ValidationError("Cannot change your own active status");
  }

  if (isTargetOwner) {
    throw new ForbiddenError("Cannot modify system-protected account");
  }

  if (isOwner) {
    return;
  }

  const allowed = await hasPermission("users.manage");
  if (!allowed) {
    throw new ForbiddenError("Unauthorized");
  }
}
