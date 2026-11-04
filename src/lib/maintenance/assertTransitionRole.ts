import type { MaintenanceStatus } from "./types";
import { canReopenTicket } from "./canReopenTicket";
import { isOperatorStatusAllowed } from "./isOperatorStatusAllowed";

export function assertTransitionRole(
  targetStatus: MaintenanceStatus,
  roles: { isReporter: boolean; isAssigned: boolean; canAssign: boolean; canClose: boolean },
): { ok: boolean; error?: string } {
  if (targetStatus === "closed" && !roles.canClose) {
    return { ok: false, error: "Only administrators can close tickets" };
  }
  if (targetStatus === "rejected" && !roles.canAssign) {
    return { ok: false, error: "Only administrators can reject tickets" };
  }
  if (targetStatus === "reopened" && !canReopenTicket(roles)) {
    return { ok: false, error: "Unauthorized to reopen ticket" };
  }
  if (!isOperatorStatusAllowed(targetStatus, roles.isAssigned || roles.canAssign)) {
    return { ok: false, error: "Only assigned operator or administrator can update status" };
  }
  return { ok: true };
}
