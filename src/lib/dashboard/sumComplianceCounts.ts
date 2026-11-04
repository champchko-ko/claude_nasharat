import type { ComplianceCounts } from "@/lib/reports/types";
import { toCompliancePercent } from "@/lib/reports/toCompliancePercent";
import type { DashboardDepartmentComplianceSlice } from "./types";

/**
 * Totals for the chart's headline, summed from the same slices the rows draw.
 * The percent is recomputed from the summed counts, so the headline can never
 * disagree with the bars.
 */
export function sumComplianceCounts(
  slices: DashboardDepartmentComplianceSlice[],
): ComplianceCounts {
  let targeted = 0;
  let compliant = 0;
  let overdue = 0;
  let notYetDue = 0;

  for (const slice of slices) {
    targeted += Math.max(0, slice.targeted);
    compliant += Math.max(0, slice.compliant);
    overdue += Math.max(0, slice.overdue);
    notYetDue += Math.max(0, slice.notYetDue);
  }

  const counts: ComplianceCounts = {
    targeted,
    compliant,
    overdue,
    notYetDue,
    notApplicable: 0,
    percent: null,
  };

  return { ...counts, percent: toCompliancePercent(counts) };
}
