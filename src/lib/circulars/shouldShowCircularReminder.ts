import type { CircularStatus } from "./types";

/**
 * Whether the "send reminder" control should be rendered for a circular.
 * Extracted from the detail page to keep that component within the project's
 * complexity budget.
 */
export function shouldShowCircularReminder(
  canManage: boolean,
  canPublish: boolean,
  status: CircularStatus,
): boolean {
  if (!canManage && !canPublish) return false;
  return status !== "draft" && status !== "cancelled";
}
