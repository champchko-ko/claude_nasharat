import type { MaintenanceStatus } from "./types";
import { assertTransitionRole } from "./assertTransitionRole";
import { assertTransitionReason } from "./assertTransitionReason";

export function assertCanTransitionStatus(params: {
  targetStatus: MaintenanceStatus;
  isReporter: boolean;
  isAssigned: boolean;
  canAssign: boolean;
  canClose: boolean;
  reason: string | null;
}): { ok: boolean; error?: string } {
  const roleCheck = assertTransitionRole(params.targetStatus, params);
  if (!roleCheck.ok) return roleCheck;
  return assertTransitionReason(params.targetStatus, params.reason);
}
