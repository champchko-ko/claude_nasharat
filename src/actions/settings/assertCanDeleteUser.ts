import { hasPermission } from "@/lib/rbac/hasPermission";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { ValidationError } from "@/lib/errors/ValidationError";

export async function assertCanDeleteUser(
  callerId: string,
  targetUserId: string,
  isOwner: boolean,
  isTargetOwner: boolean,
  callerSchoolId: string | null,
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

  if (!callerSchoolId) {
    throw new AuthenticationError("No school associated with profile");
  }

  const allowed = await hasPermission("users.manage", callerSchoolId);
  if (!allowed) {
    throw new ForbiddenError("Unauthorized");
  }
}
