import type { DashboardDepartmentComplianceSlice } from "./types";

/**
 * Slice for the selected circular: one circular targets a department at most
 * once, so every targeted department is worth a single response. Pending work
 * inherits the circular's own overdue split (all pairs share the due date).
 */
export function resolveCircularSlices(
  baseSlices: DashboardDepartmentComplianceSlice[],
  circular: {
    id: string;
    overdue: number;
    respondedDepartments: Array<{ id: string }>;
    pendingDepartments: Array<{ id: string }>;
  },
): DashboardDepartmentComplianceSlice[] {
  const responded = new Set(circular.respondedDepartments.map((department) => department.id));
  const pending = new Set(circular.pendingDepartments.map((department) => department.id));
  const pendingIsOverdue = circular.overdue > 0;

  return baseSlices
    .filter((slice) => responded.has(slice.id) || pending.has(slice.id))
    .map((slice) => {
      const hasResponded = responded.has(slice.id);
      const isOverdue = !hasResponded && pendingIsOverdue;
      return {
        ...slice,
        targeted: 1,
        compliant: hasResponded ? 1 : 0,
        overdue: isOverdue ? 1 : 0,
        notYetDue: hasResponded || isOverdue ? 0 : 1,
        percent: hasResponded ? 100 : 0,
      };
    });
}
