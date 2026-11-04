"use client";

import { useTranslations } from "next-intl";
import type { DashboardDepartmentComplianceSlice } from "@/lib/dashboard/types";
import { DashboardComplianceTrack } from "./DashboardComplianceTrack";

/**
 * One department in the compliance chart: name, direct label (`7/10 · 70%`),
 * the compliant / overdue / not-yet-due split on a shared track, and the
 * outstanding count in words.
 */
export function DashboardComplianceDistributionRow({
  slice,
}: {
  slice: DashboardDepartmentComplianceSlice;
}) {
  const t = useTranslations("dashboard");
  const displayName = slice.name || "—";
  const percent = slice.percent === null ? null : Math.min(100, Math.max(0, slice.percent));
  const outstanding = slice.overdue + slice.notYetDue;

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate font-semibold text-foreground" title={displayName}>
          {displayName}
        </span>
        <span
          className={`shrink-0 font-bold tabular-nums ${
            percent === null
              ? "text-muted-foreground"
              : slice.overdue > 0
                ? "text-destructive"
                : percent >= 80
                  ? "text-success"
                  : percent >= 50
                    ? "text-warning"
                    : "text-destructive"
          }`}
        >
          {percent === null ? "—" : `${slice.compliant}/${slice.targeted} · ${percent}%`}
        </span>
      </div>

      <DashboardComplianceTrack
        targeted={slice.targeted}
        compliant={slice.compliant}
        overdue={slice.overdue}
        notYetDue={slice.notYetDue}
      />

      <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
        {outstanding > 0
          ? t("outstandingOfTargeted", {
              outstanding,
              targeted: slice.targeted,
              overdue: slice.overdue,
            })
          : t("compliantOfTargeted", {
              compliant: slice.compliant,
              targeted: slice.targeted,
            })}
      </span>
    </li>
  );
}
