import type { MaintenancePriority } from "@/lib/maintenance/types";

export function parseMaintenanceAssignData(formData: FormData) {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v.trim() : "";
  };

  return {
    requestId: get("request_id"),
    operatorId: get("operator_id"),
    priority: (get("priority") || null) as MaintenancePriority | null,
    notes: get("notes") || null,
  };
}
