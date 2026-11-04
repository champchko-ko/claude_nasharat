export interface DashboardPermissions {
  canCircular: boolean;
  canMaintenance: boolean;
  canCalendar: boolean;
  canViewCompliance: boolean;
}

export function resolveDashboardPermissions(
  isOwner: boolean,
  perms: string[],
): DashboardPermissions {
  return {
    canCircular: isOwner || perms.includes("circular.create"),
    canMaintenance: isOwner || perms.includes("maintenance.create"),
    canCalendar: isOwner || perms.includes("calendar.manage"),
    canViewCompliance: isOwner || perms.includes("reports.view"),
  };
}
