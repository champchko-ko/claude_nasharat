import type { MaintenanceRequestRow } from "./types";
import { matchesMaintenanceSearch } from "./matchesMaintenanceSearch";
import { matchesMaintenanceStatus } from "./matchesMaintenanceStatus";

export function filterMaintenanceTickets(
  ticket: MaintenanceRequestRow,
  search: string,
  statusFilter: string,
): boolean {
  return matchesMaintenanceSearch(ticket, search) && matchesMaintenanceStatus(ticket, statusFilter);
}
