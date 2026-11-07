/**
 * Why a role cannot be deleted by this caller, or `null` when the role-level rules allow it.
 * Only the owner deletes roles; the locked owner role and system roles are permanent.
 * (Whether the role still has users is checked separately.)
 */
export function getRoleDeletionBlocker(
  role: { key: string; is_system: boolean; is_locked: boolean } | null,
  isOwner: boolean,
): string | null {
  if (!role) {
    return "Role not found";
  }

  if (!isOwner) {
    return "Only the owner can delete roles";
  }

  if (role.is_locked || role.key === "owner") {
    return "Cannot delete the owner role";
  }

  if (role.is_system) {
    return "System roles cannot be deleted";
  }

  return null;
}
