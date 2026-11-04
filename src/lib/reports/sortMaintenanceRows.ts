import type { MaintenanceReportRow, SortDirection } from "./types";

export function sortMaintenanceRows(
  rows: MaintenanceReportRow[],
  dateSort: SortDirection,
  departmentSort: SortDirection,
): MaintenanceReportRow[] {
  let result = rows;
  if (dateSort === "asc") {
    result = [...result].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } else if (dateSort === "desc") {
    result = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  if (departmentSort === "asc") {
    result = [...result].sort((a, b) =>
      (a.departmentName || "").localeCompare(b.departmentName || ""),
    );
  } else if (departmentSort === "desc") {
    result = [...result].sort((a, b) =>
      (b.departmentName || "").localeCompare(a.departmentName || ""),
    );
  }

  return result;
}
