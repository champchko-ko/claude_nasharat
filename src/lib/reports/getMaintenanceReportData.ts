import { createSupabaseServerClient } from "@/lib/supabase";
import { warnOnDataTruncation } from "@/lib/supabase/warnOnDataTruncation";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { computeAverageResolutionTime } from "./computeAverageResolutionTime";
import { mapMaintenanceReportRows } from "./mapMaintenanceReportRows";
import { applyMaintenanceReportFilters } from "./applyMaintenanceReportFilters";
import type { RawMaintenanceItem } from "./toMaintenanceReportRow";
import type { ReportFilterParams, MaintenanceReportSummaryData } from "./types";

export async function getMaintenanceReportData(
  schoolId: string,
  filters: ReportFilterParams = {},
): Promise<MaintenanceReportSummaryData> {
  const supabase = await createSupabaseServerClient();

  const baseQuery = supabase
    .from("maintenance_requests")
    .select(
      `
      id,
      ticket_number,
      title,
      category,
      priority,
      status,
      created_at,
      resolved_at,
      reporter_department_id,
      locations (building, floor, room),
      department:departments!maintenance_requests_reporter_department_id_fkey (id, name_ar, name_en),
      reporter:profiles!reporter_id (full_name),
      maintenance_assignments (
        is_active,
        operator:profiles!operator_id (full_name)
      )
    `,
    )
    .order("created_at", { ascending: false });

  const query = applyMaintenanceReportFilters(baseQuery, filters);
  const { data, error } = await query;

  if (error) {
    throw mapDatabaseError(error);
  }

  const rawList = (data ?? []) as unknown as RawMaintenanceItem[];
  warnOnDataTruncation(rawList.length, "getMaintenanceReportData");

  const { rows, priorityBreakdown, statusBreakdown } = mapMaintenanceReportRows(rawList);

  const openStatuses = new Set([
    "submitted",
    "triaged",
    "assigned",
    "in_progress",
    "waiting_for_parts",
    "reopened",
  ]);
  const resolvedStatuses = new Set(["resolved", "closed"]);

  return {
    totalTickets: rows.length,
    openCount: rows.filter((r) => openStatuses.has(r.status)).length,
    resolvedCount: rows.filter((r) => resolvedStatuses.has(r.status)).length,
    avgResolutionTimeHours: computeAverageResolutionTime(rawList),
    priorityBreakdown,
    statusBreakdown,
    rows,
  };
}
