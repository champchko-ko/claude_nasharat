/**
 * Circulars a reminder may be sent for.
 *
 * Drafts, archived, cancelled, completed and overdue circulars are closed: the
 * dashboard must not offer "urge pending" for them, and the action must not act
 * on them even if called directly (Phase 4.3).
 */
export function isRemindableStatus(status: string): boolean {
  return status === "published" || status === "in_progress";
}
