import type { MaintenanceStatus } from "./types";

const LEGAL_TRANSITIONS: Record<MaintenanceStatus, readonly MaintenanceStatus[]> = {
  submitted: ["triaged", "assigned", "rejected"],
  triaged: ["assigned"],
  assigned: ["in_progress", "waiting_for_parts"],
  in_progress: ["waiting_for_parts", "resolved"],
  waiting_for_parts: ["in_progress"],
  resolved: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["assigned", "in_progress"],
  rejected: [],
};

export function isLegalTransition(from: MaintenanceStatus, to: MaintenanceStatus): boolean {
  if (from === to) {
    return true;
  }
  const allowed = LEGAL_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}
