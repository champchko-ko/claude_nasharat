import { getEffectivePermissions } from "@/lib/rbac/getEffectivePermissions";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";

export async function assertCanDeleteAttachment(
  schoolId: string | null,
  userId: string,
): Promise<void> {
  const isOwner = await isPlatformOwner(userId);
  if (isOwner) return;

  const perms = await getEffectivePermissions(schoolId);
  const canEdit = perms.includes("circular.create") || perms.includes("circular.publish");
  if (!canEdit) {
    throw new ForbiddenError("Unauthorized");
  }
}
