import type { DashboardComplianceDeptBadge, DashboardDepartmentComplianceSlice } from "./types";

/**
 * Departments that are fully compliant, and those that still owe work with how
 * much. A partly compliant department therefore appears under pending with its
 * outstanding count, never only under responded (Phase 4.4).
 */
export function resolveDepartmentBadges(slices: DashboardDepartmentComplianceSlice[]): {
  responded: DashboardComplianceDeptBadge[];
  pending: DashboardComplianceDeptBadge[];
} {
  const responded: DashboardComplianceDeptBadge[] = [];
  const pending: DashboardComplianceDeptBadge[] = [];

  for (const slice of slices) {
    if (slice.targeted <= 0) {
      continue;
    }
    const outstanding = slice.overdue + slice.notYetDue;
    if (outstanding === 0) {
      responded.push({ id: slice.id, name: slice.name, outstanding: 0 });
    } else {
      pending.push({ id: slice.id, name: slice.name, outstanding });
    }
  }

  return { responded, pending };
}
