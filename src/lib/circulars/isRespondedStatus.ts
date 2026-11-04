/**
 * Canonical rule for "a department has responded" in circular reporting.
 *
 * A response row is created only when a department actually submits something
 * (`responder_id` is not null), but `pending`, `rejected` and `not_applicable`
 * rows are not accepted responses, so they must not be counted as such.
 *
 * Every report/dashboard calculation that counts responses has to use this
 * predicate so the same department is never "responded" on one surface and
 * "pending" on another.
 */
export function isRespondedStatus(status: string): boolean {
  return status === "acknowledged" || status === "approved" || status === "completed";
}
