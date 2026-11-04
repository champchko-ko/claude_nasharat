import type { MaintenanceStatus } from "./types";

export function assertTransitionReason(
  targetStatus: MaintenanceStatus,
  reason: string | null,
): { ok: boolean; error?: string } {
  const hasReason = Boolean(reason && reason.trim().length > 0);
  if (targetStatus === "rejected" && !hasReason) {
    return { ok: false, error: "Rejection reason is required" };
  }
  if (targetStatus === "reopened" && !hasReason) {
    return { ok: false, error: "Reopen reason is required" };
  }
  return { ok: true };
}
