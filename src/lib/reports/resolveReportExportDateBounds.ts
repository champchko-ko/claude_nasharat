import type { ReportFilterState } from "./types";

export function resolveReportExportDateBounds(filters?: Partial<ReportFilterState>): {
  from?: string;
  to?: string;
} {
  if (!filters) return {};

  if (filters.dateMode === "month" && filters.month) {
    const [year, month] = filters.month.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return {
      from: `${filters.month}-01`,
      to: `${filters.month}-${String(lastDay).padStart(2, "0")}`,
    };
  }

  if (filters.dateMode === "custom") {
    return {
      from: filters.fromDate || undefined,
      to: filters.toDate || undefined,
    };
  }

  return {};
}
