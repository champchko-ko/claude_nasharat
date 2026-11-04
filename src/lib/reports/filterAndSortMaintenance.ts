import { matchesDateFilter } from "./matchesDateFilter";
import { sortMaintenanceRows } from "./sortMaintenanceRows";
import type { MaintenanceReportSummaryData, ReportFilterState } from "./types";

const OPEN_STATUSES = new Set([
  "submitted",
  "triaged",
  "assigned",
  "in_progress",
  "waiting_for_parts",
  "reopened",
]);
const RESOLVED_STATUSES = new Set(["resolved", "closed"]);

export function filterAndSortMaintenance(
  data: MaintenanceReportSummaryData,
  filters: ReportFilterState,
): MaintenanceReportSummaryData {
  const filtered = data.rows.filter((row) => {
    const dateOk = matchesDateFilter(
      row.createdAt,
      filters.dateMode,
      filters.month,
      filters.fromDate,
      filters.toDate,
    );
    if (!dateOk) return false;
    if (filters.departmentId !== "all" && row.departmentId !== filters.departmentId) {
      return false;
    }
    return true;
  });

  const sortedRows = sortMaintenanceRows(filtered, filters.dateSort, filters.departmentSort);

  const priorityBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};
  let totalResolvedHours = 0;
  let resolvedCountWithHours = 0;

  for (const r of sortedRows) {
    priorityBreakdown[r.priority] = (priorityBreakdown[r.priority] || 0) + 1;
    statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
    if (r.resolutionTimeHours !== null && r.resolutionTimeHours !== undefined) {
      totalResolvedHours += r.resolutionTimeHours;
      resolvedCountWithHours++;
    }
  }

  const avgHours =
    resolvedCountWithHours > 0
      ? Math.round((totalResolvedHours / resolvedCountWithHours) * 10) / 10
      : null;

  return {
    totalTickets: sortedRows.length,
    openCount: sortedRows.filter((r) => OPEN_STATUSES.has(r.status)).length,
    resolvedCount: sortedRows.filter((r) => RESOLVED_STATUSES.has(r.status)).length,
    avgResolutionTimeHours: avgHours,
    priorityBreakdown,
    statusBreakdown,
    rows: sortedRows,
  };
}
