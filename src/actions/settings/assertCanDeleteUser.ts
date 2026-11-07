import { hasPermission } from "@/lib/rbac/hasPermission";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { ValidationError } from "@/lib/errors/ValidationError";

export async function assertCanDeleteUser(
  callerId: string,
  targetUserId: string,
  isOwner: boolean,
  isTargetOwner: boolean,
): Promise<void> {
  if (callerId === targetUserId) {
    throw new ValidationError("Cannot delete your own account");
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
