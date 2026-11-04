import type { MaintenanceRequestRow } from "./types";

export function matchesMaintenanceSearch(ticket: MaintenanceRequestRow, search: string): boolean {
  if (!search) return true;
  const q = search.toLowerCase();
  return (
    ticket.ticket_number.toLowerCase().includes(q) ||
    ticket.title.toLowerCase().includes(q) ||
    Boolean(ticket.reporter?.full_name?.toLowerCase().includes(q)) ||
    Boolean(ticket.assigned_operator?.full_name?.toLowerCase().includes(q))
  );
}
