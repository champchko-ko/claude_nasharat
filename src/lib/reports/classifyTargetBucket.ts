import { isRespondedStatus } from "@/lib/circulars/isRespondedStatus";

export type ComplianceBucket = "compliant" | "overdue" | "notYetDue" | "notApplicable";

/**
 * Which bucket one (circular, department) target falls into.
 *
 * - `not_applicable` is removed from the denominator rather than counted as
 *   compliance or as outstanding work.
 * - A compliant response is `acknowledged`, `approved` or `completed`; a
 *   `rejected` or `pending` response stays outstanding.
 * - Outstanding work is overdue once the circular's due date has passed, and
 *   not yet due otherwise (including circulars with no due date).
 */
export function classifyTargetBucket({
  responseStatus,
  dueAt,
  now,
}: {
  responseStatus: string | undefined;
  dueAt: string | null;
  now: Date;
}): ComplianceBucket {
  if (responseStatus === "not_applicable") {
    return "notApplicable";
  }
  if (responseStatus && isRespondedStatus(responseStatus)) {
    return "compliant";
  }
  if (dueAt && new Date(dueAt).getTime() < now.getTime()) {
    return "overdue";
  }
  return "notYetDue";
}
