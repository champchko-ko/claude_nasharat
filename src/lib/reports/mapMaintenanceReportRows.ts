import { toMaintenanceReportRow, type RawMaintenanceItem } from "./toMaintenanceReportRow";
import type { MaintenanceReportRow } from "./types";

export function mapMaintenanceReportRows(rawList: RawMaintenanceItem[]): {
  rows: MaintenanceReportRow[];
  priorityBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
} {
  const priorityBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};

  const rows = rawList.map((t) => {
    priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1;
    statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
    return toMaintenanceReportRow(t);
  });

  return { rows, priorityBreakdown, statusBreakdown };
}
