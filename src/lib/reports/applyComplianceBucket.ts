import type { ComplianceBucket } from "./classifyTargetBucket";
import type { ComplianceCounts } from "./types";

/**
 * Folds one target into a count set.
 *
 * `not_applicable` targets are recorded but never enter the denominator, which
 * is the rule in Dashboard_Fix_All_Issues_Prompt.md §1.
 */
export function applyComplianceBucket(counts: ComplianceCounts, bucket: ComplianceBucket): void {
  if (bucket === "notApplicable") {
    counts.notApplicable += 1;
    return;
  }

  counts.targeted += 1;
  if (bucket === "compliant") {
    counts.compliant += 1;
  } else if (bucket === "overdue") {
    counts.overdue += 1;
  } else {
    counts.notYetDue += 1;
  }
}
