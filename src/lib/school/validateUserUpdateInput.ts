export function validateUserUpdateInput(
  fullName: string,
  userId: string,
  currentUserId: string,
  isActive?: boolean,
): { valid: boolean; error?: string } {
  if (!fullName.trim()) {
    return { valid: false, error: "Full name is required" };
  }

  if (userId === currentUserId && isActive === false) {
    return { valid: false, error: "Cannot deactivate your own account" };
  }

  return { valid: true };
}
