import type { MaintenanceStatus } from "./types";

export function buildStatusUpdatePayload(params: {
  targetStatus: MaintenanceStatus;
  userId: string;
  reason?: string | null;
}): Record<string, unknown> {
  const { targetStatus, userId, reason } = params;
  const payload: Record<string, unknown> = {
    status: targetStatus,
    updated_at: new Date().toISOString(),
  };

  if (targetStatus === "rejected") payload.rejection_reason = reason;
  if (targetStatus === "reopened") payload.reopen_reason = reason;
  if (targetStatus === "closed") {
    payload.closed_at = new Date().toISOString();
    payload.closed_by = userId;
  }

  return payload;
}
