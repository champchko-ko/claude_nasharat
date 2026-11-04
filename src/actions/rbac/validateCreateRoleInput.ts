import { ForbiddenError, ValidationError } from "@/lib/errors";

export function validateCreateRoleInput(
  name: string,
  key: string,
): { trimmedName: string; trimmedKey: string } {
  const trimmedName = name.trim();
  const trimmedKey = key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_");

  if (!trimmedName || !trimmedKey) {
    throw new ValidationError("Role name and key are required");
  }

  if (trimmedKey === "owner" || trimmedKey === "platform_owner") {
    throw new ForbiddenError("Cannot create a role with reserved key 'owner'");
  }

  return { trimmedName, trimmedKey };
}
