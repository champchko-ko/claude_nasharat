import type { MaintenanceStatus } from "@/lib/maintenance/types";
import { maintenanceTransitionSchema } from "./maintenanceTransitionSchema";
import { formatZodError } from "./formatZodError";

export function parseMaintenanceTransitionData(formData: FormData) {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v.trim() : "";
  };

  const photoEntry = formData.get("evidence_photo");
  const evidencePhoto = photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null;

  const rawInput = {
    requestId: get("request_id"),
    targetStatus: get("target_status") || "submitted",
    reason: get("reason") || null,
  };

  const parsed = maintenanceTransitionSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw formatZodError(parsed.error);
  }

  return {
    ...parsed.data,
    targetStatus: parsed.data.targetStatus as MaintenanceStatus,
    evidencePhoto,
  };
}
