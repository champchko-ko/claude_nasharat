import type { ComplianceCounts } from "./types";

/** Percent of the denominator that is compliant; null when nothing was required. */
export function toCompliancePercent(counts: ComplianceCounts): number | null {
  if (counts.targeted <= 0) {
    return null;
  }
  return Math.min(100, Math.round((counts.compliant / counts.targeted) * 100));
}
