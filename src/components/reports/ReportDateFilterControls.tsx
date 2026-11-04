"use client";

import { useTranslations } from "next-intl";
import { FilterIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ReportDateMode, ReportFilterState } from "@/lib/reports/types";

export function ReportDateFilterControls({
  dateMode,
  month,
  fromDate,
  toDate,
  onChange,
}: {
  dateMode: ReportDateMode;
  month: string;
  fromDate: string;
  toDate: string;
  onChange: (updates: Partial<ReportFilterState>) => void;
}) {
  const t = useTranslations("reports.filters");

  return (
    <>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <FilterIcon className="size-3.5" />
        <span>{t("dateMode")}:</span>
      </div>

      <select
        value={dateMode}
        onChange={(e) => onChange({ dateMode: e.target.value as ReportDateMode })}
        className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="all">{t("allTime")}</option>
        <option value="month">{t("byMonth")}</option>
        <option value="custom">{t("customDate")}</option>
      </select>

      {dateMode === "month" && (
        <Input
          type="month"
          value={month}
          onChange={(e) => onChange({ month: e.target.value })}
          className="h-9 w-40 text-xs"
        />
      )}

      {dateMode === "custom" && (
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => onChange({ fromDate: e.target.value })}
            className="h-9 w-36 text-xs"
            placeholder={t("from")}
          />
          <span className="text-xs text-muted-foreground">—</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => onChange({ toDate: e.target.value })}
            className="h-9 w-36 text-xs"
            placeholder={t("to")}
          />
        </div>
      )}
    </>
  );
}
