export interface CircularPagePermissions {
  isOwner: boolean;
  canPublish: boolean;
  canManage: boolean;
  canViewResponses: boolean;
}

/**
 * Derives the circular UI capabilities from effective permissions.
 *
 * `isOwner` is now passed in from a verified platform-owner check instead of
 * being inferred from `settings.platform.update` / `roles.manage`, which any
 * school admin holds (audit finding H-10).
 */
export function getCircularPermissions(perms: string[], isOwner = false): CircularPagePermissions {
  const canPublish = isOwner || perms.includes("circular.publish");
  const canManage = canPublish || perms.includes("circular.create");
  const canViewResponses =
    isOwner || perms.includes("circular.view_responses") || perms.includes("audit.view");

  return { isOwner, canPublish, canManage, canViewResponses };
}
