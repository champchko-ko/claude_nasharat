"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowDownUpIcon, RotateCcwIcon } from "lucide-react";
import { PANEL } from "@/components/ui/diamond-card-styles";
import { chipClass } from "@/components/ui/segment-styles";
import { ReportDateFilterControls } from "./ReportDateFilterControls";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import type { ReportFilterState, SortDirection } from "@/lib/reports/types";

export function ReportFiltersBar({
  filters,
  onFilterChange,
  onReset,
  departments,
}: {
  filters: ReportFilterState;
  onFilterChange: (updates: Partial<ReportFilterState>) => void;
  onReset: () => void;
  departments: DepartmentRow[];
}) {
  const t = useTranslations("reports.filters");
  const locale = useLocale();

  const isFiltered =
    filters.dateMode !== "all" ||
    filters.departmentId !== "all" ||
    filters.dateSort !== "desc" ||
    filters.departmentSort !== "none";

  return (
    <div
      className={`${PANEL} flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ReportDateFilterControls
          dateMode={filters.dateMode}
          month={filters.month}
          fromDate={filters.fromDate}
          toDate={filters.toDate}
          onChange={onFilterChange}
        />

        <select
          value={filters.departmentId}
          onChange={(e) => onFilterChange({ departmentId: e.target.value })}
          className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="all">{t("allDepartments")}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {locale === "ar" ? d.name_ar : d.name_en}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <ArrowDownUpIcon className="size-3.5" />
          <span>Sort:</span>
        </div>

        <select
          value={filters.dateSort}
          onChange={(e) => onFilterChange({ dateSort: e.target.value as SortDirection })}
          className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="desc">{t("newestFirst")}</option>
          <option value="asc">{t("oldestFirst")}</option>
        </select>

        <select
          value={filters.departmentSort}
          onChange={(e) => onFilterChange({ departmentSort: e.target.value as SortDirection })}
          className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="none">{t("defaultOrder")}</option>
          <option value="asc">{t("deptAsc")}</option>
          <option value="desc">{t("deptDesc")}</option>
        </select>

        {isFiltered && (
          <button type="button" onClick={onReset} className={`${chipClass(false)} gap-1 text-xs`}>
            <RotateCcwIcon className="size-3.5" />
            <span>{t("reset")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
