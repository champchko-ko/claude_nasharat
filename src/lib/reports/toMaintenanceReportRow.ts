import { computeTicketResolutionHours } from "./computeTicketResolutionHours";
import { extractActiveOperatorName } from "./extractActiveOperatorName";
import { extractTicketDepartment } from "./extractTicketDepartment";
import type { MaintenanceReportRow } from "./types";

export interface RawMaintenanceItem {
  id: string;
  ticket_number: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  locations?: { building: string; floor: string; room: string } | null;
  reporter_department_id?: string | null;
  department?: { id: string; name_ar: string; name_en: string } | null;
  reporter?: { full_name: string } | null;
  maintenance_assignments?: Array<{
    is_active: boolean;
    operator?: { full_name: string } | null;
  }> | null;
}

export function toMaintenanceReportRow(t: RawMaintenanceItem): MaintenanceReportRow {
  const loc = t.locations;
  const locationName = loc ? `${loc.building} - ${loc.floor} - ${loc.room}` : "—";
  const operatorName = extractActiveOperatorName(t.maintenance_assignments);
  const resolutionTimeHours = computeTicketResolutionHours(t.created_at, t.resolved_at);
  const dept = extractTicketDepartment(t.department, t.reporter_department_id);

  return {
    id: t.id,
    ticketNumber: t.ticket_number,
    title: t.title,
    category: t.category,
    priority: t.priority,
    status: t.status,
    locationName,
    reporterName: t.reporter?.full_name ?? "—",
    departmentId: dept.id,
    departmentName: dept.name,
    operatorName,
    createdAt: t.created_at,
    resolvedAt: t.resolved_at,
    resolutionTimeHours,
  };
}
