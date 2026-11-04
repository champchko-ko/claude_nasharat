"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RepeatIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { CalendarRecurrenceFrequency } from "@/lib/calendar/types";

export function CalendarRecurrenceFields() {
  const t = useTranslations("calendar");
  const [freq, setFreq] = useState<CalendarRecurrenceFrequency>("none");

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex items-center gap-2">
        <RepeatIcon className="size-4 text-primary" />
        <Label htmlFor="recurrence_freq" className="text-sm font-semibold">
          {t("recurrence")}
        </Label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recurrence_freq">{t("recurrenceFreq")}</Label>
          <select
            id="recurrence_freq"
            name="recurrence_freq"
            value={freq}
            onChange={(e) => setFreq(e.target.value as CalendarRecurrenceFrequency)}
            className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="none">{t("recurrenceNone")}</option>
            <option value="daily">{t("recurrenceDaily")}</option>
            <option value="weekly">{t("recurrenceWeekly")}</option>
            <option value="biweekly">{t("recurrenceBiweekly")}</option>
            <option value="monthly">{t("recurrenceMonthly")}</option>
          </select>
        </div>

        {freq !== "none" && (
          <div className="space-y-2">
            <Label htmlFor="recurrence_until">{t("recurrenceUntil")}</Label>
            <Input id="recurrence_until" name="recurrence_until" type="date" />
          </div>
        )}
      </div>

      {freq !== "none" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="recurrence_count">{t("recurrenceCount")}</Label>
            <Input
              id="recurrence_count"
              name="recurrence_count"
              type="number"
              min={1}
              max={52}
              defaultValue={12}
            />
          </div>
          <div className="flex items-end pb-2">
            <p className="text-xs text-muted-foreground">{t("recurrenceHelp")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
