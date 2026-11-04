"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CalendarCategory } from "@/lib/calendar/types";

const CATEGORIES: CalendarCategory[] = [
  "event",
  "academic",
  "exam",
  "holiday",
  "meeting",
  "activity",
  "other",
];

export function CalendarCoreFields({
  defaultCategory,
  defaultTitleAr,
  defaultTitleEn,
  defaultDescription,
  defaultLocation,
}: {
  defaultCategory?: CalendarCategory;
  defaultTitleAr?: string;
  defaultTitleEn?: string | null;
  defaultDescription?: string | null;
  defaultLocation?: string | null;
}) {
  const t = useTranslations("calendar");
  const tCat = useTranslations("calendar.categories");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title_ar">{t("titleAr")} *</Label>
          <Input
            id="title_ar"
            name="title_ar"
            required
            defaultValue={defaultTitleAr ?? ""}
            placeholder={t("titleAr")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title_en">{t("titleEn")}</Label>
          <Input
            id="title_en"
            name="title_en"
            defaultValue={defaultTitleEn ?? ""}
            placeholder={t("titleEn")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">{t("category")} *</Label>
          <select
            id="category"
            name="category"
            defaultValue={defaultCategory ?? "event"}
            className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {tCat(c)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">{t("location")}</Label>
          <Input
            id="location"
            name="location"
            defaultValue={defaultLocation ?? ""}
            placeholder={t("locationPlaceholder")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("eventDescription")}</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultDescription ?? ""}
        />
      </div>
    </div>
  );
}
