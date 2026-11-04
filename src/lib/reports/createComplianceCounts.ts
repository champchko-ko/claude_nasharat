import type { ComplianceCounts } from "./types";

/** A zeroed count set; `percent` stays null until a scope has a denominator. */
export function createComplianceCounts(): ComplianceCounts {
  return {
    targeted: 0,
    compliant: 0,
    overdue: 0,
    notYetDue: 0,
    notApplicable: 0,
    percent: null,
  };
}
