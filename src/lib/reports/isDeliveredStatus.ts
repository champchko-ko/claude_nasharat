/**
 * The only circular statuses that create a response obligation.
 *
 * Drafts have not been issued, and archived or cancelled circulars no longer
 * ask for anything, so none of them may enter a compliance denominator
 * (Dashboard_Fix_All_Issues_Prompt.md §1).
 */
export function isDeliveredStatus(status: string): boolean {
  return (
    status === "published" ||
    status === "in_progress" ||
    status === "completed" ||
    status === "overdue"
  );
}
