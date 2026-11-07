// Mirrors the database permission catalogue (seeded in migration 0009).
// `permissions.seed.test.ts` fails if this list or the labels in
// permissionCatalog.ts drift from that seed. A new key is added here, in the
// catalogue and in a migration together with the policy or screen that enforces it.
export const PERMISSION_KEYS = [
  "circular.create",
  "circular.publish",
  "circular.assign",
  "circular.respond",
  "circular.view_responses",
  "maintenance.create",
  "maintenance.assign",
  "maintenance.update",
  "maintenance.close",
  "calendar.manage",
  "settings.school.update",
  "settings.platform.update",
  "users.manage",
  "roles.manage",
  "reports.view",
  "audit.view",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
