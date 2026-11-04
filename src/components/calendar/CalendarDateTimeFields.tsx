"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { isWeekendDay } from "@/lib/calendar/isWeekendDay";
import { CalendarWeekendNotice } from "./CalendarWeekendNotice";
import type { CalendarVisibility } from "@/lib/calendar/types";

type CalendarDateTimeFieldsProps = {
  defaultStartsAt?: string;
  defaultEndsAt?: string;
  defaultAllDay?: boolean;
  defaultVisibility?: CalendarVisibility;
  workingDays?: number[] | null;
};

export function CalendarDateTimeFields({
  defaultStartsAt,
  defaultEndsAt,
  defaultAllDay,
  defaultVisibility,
  workingDays,
}: CalendarDateTimeFieldsProps) {
  const t = useTranslations("calendar");
  const tVis = useTranslations("calendar.visibilities");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isWeekendDay(e.target.value, workingDays)) {
      e.target.value = "";
      toast.error(t("weekendNotAllowed"));
    }
  };

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <CalendarWeekendNotice />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="starts_at">{t("startsAt")} *</Label>
          <Input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={defaultStartsAt ?? ""}
            onChange={handleDateChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ends_at">{t("endsAt")} *</Label>
          <Input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            required
            defaultValue={defaultEndsAt ?? ""}
            onChange={handleDateChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="visibility">{t("visibility")} *</Label>
          <select
            id="visibility"
            name="visibility"
            defaultValue={defaultVisibility ?? "internal"}
            className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="internal">{tVis("internal")}</option>
            <option value="public">{tVis("public")}</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            id="all_day"
            name="all_day"
            type="checkbox"
            defaultChecked={defaultAllDay ?? false}
            className="size-4 rounded border-input"
          />
          <Label htmlFor="all_day" className="cursor-pointer text-sm font-medium">
            {t("allDay")}
          </Label>
        </div>
      </div>
    </div>
  );
}
