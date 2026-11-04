import type { MaintenanceStatus } from "./types";

export function isOperatorStatusAllowed(status: MaintenanceStatus, canOperate: boolean): boolean {
  if (status === "in_progress" || status === "waiting_for_parts" || status === "resolved") {
    return canOperate;
  }
  return true;
}
