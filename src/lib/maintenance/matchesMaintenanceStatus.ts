import type { MaintenanceRequestRow } from "./types";

export function matchesMaintenanceStatus(
  ticket: MaintenanceRequestRow,
  statusFilter: string,
): boolean {
  if (statusFilter === "emergency") return ticket.priority === "emergency";
  if (statusFilter === "in_progress")
    return ticket.status === "in_progress" || ticket.status === "assigned";
  if (statusFilter === "resolved") return ticket.status === "resolved";
  if (statusFilter === "closed") return ticket.status === "closed";
  return true;
}
