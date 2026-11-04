import type { ReportFilterState } from "./types";
import { resolveReportExportDateBounds } from "./resolveReportExportDateBounds";

export function buildReportExportParams(
  type: "circulars" | "maintenance",
  filters?: Partial<ReportFilterState>,
): URLSearchParams {
  const params = new URLSearchParams({ type });
  if (!filters) return params;

  if (filters.departmentId && filters.departmentId !== "all") {
    params.set("departmentId", filters.departmentId);
  }

  const bounds = resolveReportExportDateBounds(filters);
  if (bounds.from) params.set("from", bounds.from);
  if (bounds.to) params.set("to", bounds.to);

  return params;
}
