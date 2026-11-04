"use client";

import { useTranslations } from "next-intl";
import { CalendarDaysIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

const DAYS_OF_WEEK = [
  { value: 0, labelKey: "daySunday" },
  { value: 1, labelKey: "dayMonday" },
  { value: 2, labelKey: "dayTuesday" },
  { value: 3, labelKey: "dayWednesday" },
  { value: 4, labelKey: "dayThursday" },
  { value: 5, labelKey: "dayFriday" },
  { value: 6, labelKey: "daySaturday" },
] as const;

const DATE_FORMATS = [
  { value: "yyyy-MM-dd", labelKey: "dateFormatIso" },
  { value: "dd/MM/yyyy", labelKey: "dateFormatSlash" },
  { value: "MM/dd/yyyy", labelKey: "dateFormatUs" },
] as const;

const DEFAULT_WORKING_DAYS = [0, 1, 2, 3, 4];
const DEFAULT_DATE_FORMAT = "yyyy-MM-dd";

export function SchoolOperationFields({
  workingDays,
  dateFormat,
  canManage,
}: {
  workingDays?: number[] | null;
  dateFormat?: string | null;
  canManage: boolean;
}) {
  const t = useTranslations("settings");
  const activeDays = workingDays ?? DEFAULT_WORKING_DAYS;
  const activeFormat = dateFormat ?? DEFAULT_DATE_FORMAT;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:col-span-2">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <CalendarDaysIcon className="size-5 text-primary" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("operationalSettings")}</h3>
          <p className="text-xs text-muted-foreground">{t("workingDaysHint")}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("workingDays")}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
          {DAYS_OF_WEEK.map((day) => (
            <label
              key={day.value}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2.5 text-xs transition-colors hover:bg-muted/50 has-checked:border-primary/50 has-checked:bg-primary/5 has-checked:font-medium"
            >
              <input
                type="checkbox"
                name="working_days"
                value={day.value}
                defaultChecked={activeDays.includes(day.value)}
                disabled={!canManage}
                className="rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed"
              />
              <span className="truncate">{t(day.labelKey)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2 sm:max-w-xs">
        <Label htmlFor="date_format">{t("dateFormat")}</Label>
        <select
          id="date_format"
          name="date_format"
          defaultValue={activeFormat}
          disabled={!canManage}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {DATE_FORMATS.map((fmt) => (
            <option key={fmt.value} value={fmt.value}>
              {t(fmt.labelKey)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
