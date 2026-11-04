"use client";

import { useTranslations } from "next-intl";
import { formatLocation } from "@/lib/maintenance/formatLocation";
import type { LocationRow } from "@/lib/school/getSchoolLocations";

export function LocationPicker({
  locations,
  defaultValue,
}: {
  locations: LocationRow[];
  defaultValue?: string;
}) {
  const t = useTranslations("maintenance");

  return (
    <select
      name="location_id"
      defaultValue={defaultValue ?? ""}
      className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
    >
      <option value="">{t("selectLocation")}</option>
      {locations.map((loc) => (
        <option key={loc.id} value={loc.id}>
          {formatLocation(loc)}
        </option>
      ))}
    </select>
  );
}
