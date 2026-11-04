import { createComplianceCounts } from "./createComplianceCounts";
import { matchesDateFilter } from "./matchesDateFilter";
import { toCompliancePercent } from "./toCompliancePercent";
import type { CircularsReportSummaryData, ReportFilterState } from "./types";

export function filterAndSortCirculars(
  data: CircularsReportSummaryData,
  filters: ReportFilterState,
): CircularsReportSummaryData {
  let filteredRows = data.rows.filter((row) => {
    const dateOk = matchesDateFilter(
      row.publishAt,
      filters.dateMode,
      filters.month,
      filters.fromDate,
      filters.toDate,
    );
    if (!dateOk) return false;
    if (filters.departmentId !== "all") {
      const matchResp = row.respondedDepartments.some((d) => d.id === filters.departmentId);
      const matchPend = row.pendingDepartments.some((d) => d.id === filters.departmentId);
      if (!matchResp && !matchPend) return false;
    }
    return true;
  });

  if (filters.dateSort === "asc") {
    filteredRows = [...filteredRows].sort((a, b) =>
      (a.publishAt || "").localeCompare(b.publishAt || ""),
    );
  } else if (filters.dateSort === "desc") {
    filteredRows = [...filteredRows].sort((a, b) =>
      (b.publishAt || "").localeCompare(a.publishAt || ""),
    );
  }

  let complianceItems = data.departmentBreakdown;
  if (filters.departmentId !== "all") {
    complianceItems = complianceItems.filter((d) => d.departmentId === filters.departmentId);
  }
  if (filters.departmentSort === "asc") {
    complianceItems = [...complianceItems].sort((a, b) =>
      a.departmentName.localeCompare(b.departmentName),
    );
  } else if (filters.departmentSort === "desc") {
    complianceItems = [...complianceItems].sort((a, b) =>
      b.departmentName.localeCompare(a.departmentName),
    );
  }

  // Totals are the sum of the same per-department counts the table shows, so a
  // filtered view can never report a rate its own table contradicts.
  const totals = createComplianceCounts();
  for (const item of complianceItems) {
    totals.targeted += item.targeted;
    totals.compliant += item.compliant;
    totals.overdue += item.overdue;
    totals.notYetDue += item.notYetDue;
    totals.notApplicable += item.notApplicable;
  }

  return {
    totalCirculars: filteredRows.length,
    publishedCount: filteredRows.filter(
      (c) => c.status === "published" || c.status === "in_progress",
    ).length,
    overdueCount: totals.overdue,
    totals: { ...totals, percent: toCompliancePercent(totals) },
    departmentBreakdown: complianceItems,
    rows: filteredRows,
  };
}
