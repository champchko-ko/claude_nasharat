import type { MaintenanceCategory, MaintenancePriority } from "@/lib/maintenance/types";
import { maintenanceSchema } from "./maintenanceSchema";
import { formatZodError } from "./formatZodError";

export function parseMaintenanceFormData(formData: FormData) {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v.trim() : "";
  };

  const photoEntry = formData.get("photo");
  const photo = photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null;

  const rawInput = {
    title: get("title"),
    description: get("description"),
    category: get("category") || "other",
    priority: get("priority") || "medium",
    locationId: get("location_id") || null,
    area: get("area") || null,
    assetRef: get("asset_ref") || null,
  };

  const parsed = maintenanceSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw formatZodError(parsed.error);
  }

  return {
    ...parsed.data,
    category: parsed.data.category as MaintenanceCategory,
    priority: parsed.data.priority as MaintenancePriority,
    photo,
  };
}
