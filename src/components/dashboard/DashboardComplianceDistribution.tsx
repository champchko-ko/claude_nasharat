"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { sortDepartmentSlices } from "@/lib/dashboard/sortDepartmentSlices";
import type { DashboardDepartmentComplianceSlice } from "@/lib/dashboard/types";
import { DashboardComplianceDistributionRow } from "./DashboardComplianceDistributionRow";

/** Departments shown before the "show all" control; lowest compliance first. */
const LOWEST_DEPARTMENTS = 5;

/**
 * The compliance chart: one three-part row per targeted department, worst first,
 * with the shared benchmark tick visible on every row and a control to reveal
 * the rest once more than five departments are behind.
 */
export function DashboardComplianceDistribution({
  slices,
}: {
  slices: DashboardDepartmentComplianceSlice[];
}) {
  const t = useTranslations("dashboard");
  const [showAll, setShowAll] = useState(false);
  const rows = sortDepartmentSlices(slices.filter((slice) => slice.targeted > 0));
  const visible = showAll ? rows : rows.slice(0, LOWEST_DEPARTMENTS);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs font-medium text-muted-foreground">
        {t("noComplianceData")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-1.5">
        <h3 className="text-xs font-bold text-muted-foreground">{t("complianceByDepartment")}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-muted-foreground">
          <span>{t("sortedByLowestCompliance")}</span>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        {visible.map((slice) => (
          <DashboardComplianceDistributionRow key={slice.id} slice={slice} />
        ))}
      </ul>

      {rows.length > LOWEST_DEPARTMENTS ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setShowAll((current) => !current)}
          >
            {showAll ? t("showLowestDepartments") : t("showAllDepartments")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
