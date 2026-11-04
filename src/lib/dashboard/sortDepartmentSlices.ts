import type { DashboardDepartmentComplianceSlice } from "./types";

/**
 * Orders departments for the compliance chart: lowest compliance first, then the
 * department with more overdue work, then by name. Departments with no rate
 * (nothing targeted) sort last so they cannot occupy the top of the chart.
 */
export function sortDepartmentSlices(
  slices: DashboardDepartmentComplianceSlice[],
): DashboardDepartmentComplianceSlice[] {
  return [...slices].sort((a, b) => {
    const rateA = a.percent === null ? Number.POSITIVE_INFINITY : a.percent;
    const rateB = b.percent === null ? Number.POSITIVE_INFINITY : b.percent;
    if (rateA !== rateB) {
      return rateA - rateB;
    }
    if (b.overdue !== a.overdue) {
      return b.overdue - a.overdue;
    }
    const nameDiff = a.name.localeCompare(b.name, "ar", { sensitivity: "base" });
    if (nameDiff !== 0) {
      return nameDiff;
    }
    return a.id.localeCompare(b.id);
  });
}
