"use client";

import { useTranslations } from "next-intl";
import type { ComplianceCounts } from "@/lib/reports/types";
import { DashboardComplianceTrack } from "./DashboardComplianceTrack";

/**
 * Headline for the compliance chart: the overall percentage, the counts behind
 * it, the three-part legend, and the same track the department rows use.
 */
export function DashboardComplianceOverview({
  label,
  counts,
}: {
  label: string;
  counts: ComplianceCounts;
}) {
  const t = useTranslations("dashboard");
  const hasData = counts.targeted > 0;
  const tone = hasData && counts.percent !== null ? counts.percent : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-[color:var(--panel,var(--muted))] p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-3">
          <span
            className={`font-heading text-3xl font-black tracking-tight tabular-nums ${
              tone === null
                ? "text-muted-foreground"
                : tone >= 80
                  ? "text-success"
                  : tone >= 50
                    ? "text-warning"
                    : "text-destructive"
            }`}
          >
            {tone === null ? "—" : `${tone}%`}
          </span>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground" title={label}>
              {label}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground tabular-nums">
              {t("compliantOfTargeted", {
                compliant: counts.compliant,
                targeted: counts.targeted,
              })}
            </p>
          </div>
        </div>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            {t("legendCompliant")}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" aria-hidden="true" />
            {t("legendOverdue")}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground/45" aria-hidden="true" />
            {t("legendNotYetDue")}
          </li>
        </ul>
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={tone ?? 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={t("compliantOfTargeted", {
          compliant: counts.compliant,
          targeted: counts.targeted,
        })}
      >
        <DashboardComplianceTrack
          targeted={counts.targeted}
          compliant={counts.compliant}
          overdue={counts.overdue}
          notYetDue={counts.notYetDue}
          heightClass="h-3"
        />
      </div>
    </div>
  );
}
