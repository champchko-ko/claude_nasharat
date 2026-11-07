import { ForbiddenError, ValidationError } from "@/lib/errors";

// Matches the roles.key check in the database baseline (migration 0003).
const ROLE_KEY_PATTERN = /^[a-z][a-z0-9_]{1,62}$/;

export function validateCreateRoleInput(
  name: string,
  key: string,
): { trimmedName: string; trimmedKey: string } {
  const trimmedName = name.trim();
  const trimmedKey = key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");

  if (!trimmedName || !trimmedKey) {
    throw new ValidationError("Role name and key are required");
  }

  if (trimmedKey === "owner" || trimmedKey === "platform_owner") {
    throw new ForbiddenError("Cannot create a role with reserved key 'owner'");
  }

  if (!ROLE_KEY_PATTERN.test(trimmedKey)) {
    throw new ValidationError(
      "Role key must start with a letter and use 2 to 63 letters, digits or underscores",
    );
  }

  return { trimmedName, trimmedKey };
}
