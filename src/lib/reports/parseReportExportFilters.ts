import type { ReportFilterParams } from "./types";

export function parseReportExportFilters(
  searchParams: URLSearchParams,
  scopedDepartmentId?: string | null,
): ReportFilterParams {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const departmentId = scopedDepartmentId ?? searchParams.get("departmentId");

  return {
    from: from ?? undefined,
    to: to ?? undefined,
    departmentId: departmentId ?? undefined,
    status: status ?? undefined,
    category: category ?? undefined,
  };
}
