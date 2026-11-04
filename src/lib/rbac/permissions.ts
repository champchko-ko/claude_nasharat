// Mirrors the database permission catalog (migration 0010).
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
