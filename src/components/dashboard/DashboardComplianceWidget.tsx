"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileTextIcon, PieChartIcon } from "lucide-react";
import { GoldDots } from "@/components/ui/gold-dots";
import { PANEL } from "@/components/ui/diamond-card-styles";
import { CircularRemindButton } from "@/components/circulars/CircularRemindButton";
import { isRemindableStatus } from "@/lib/circulars/isRemindableStatus";
import { resolveSelectedComplianceView } from "@/lib/dashboard/resolveSelectedComplianceView";
import { resolveDepartmentBadges } from "@/lib/dashboard/resolveDepartmentBadges";
import { sumComplianceCounts } from "@/lib/dashboard/sumComplianceCounts";
import type { DashboardComplianceData } from "@/lib/dashboard/types";
import { DashboardComplianceDeptsCard } from "./DashboardComplianceDeptsCard";
import { DashboardComplianceDistribution } from "./DashboardComplianceDistribution";
import { DashboardComplianceOverview } from "./DashboardComplianceOverview";

export function DashboardComplianceWidget({ data }: { data: DashboardComplianceData }) {
  const t = useTranslations("dashboard");
  const [selectedCircularId, setSelectedCircularId] = useState<string>(
    () => data.circulars[0]?.id ?? "all",
  );

  const { selectedCircular, displayedSlices } = resolveSelectedComplianceView(
    data,
    selectedCircularId,
  );

  const counts = sumComplianceCounts(displayedSlices);
  const { responded, pending } = resolveDepartmentBadges(displayedSlices);

  // Reminders only make sense while a circular is open; in the "all" view the
  // server resolves the school-wide pending set.
  const canRemind =
    (selectedCircular ? isRemindableStatus(selectedCircular.status) : true) && pending.length > 0;

  return (
    <div className={`${PANEL} flex flex-col gap-5 p-5 sm:p-6`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-gold shadow-xs">
              <PieChartIcon className="size-4 text-gold" />
            </div>
            <h2 className="font-heading text-base font-extrabold tracking-tight text-primary sm:text-lg">
              {t("circularCompliance")}
            </h2>
            <GoldDots />
          </div>
          <p className="text-xs text-muted-foreground">{t("circularComplianceDesc")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {data.circulars.length > 0 && (
            <div className="w-full sm:w-auto">
              <div className="relative">
                <FileTextIcon className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-primary" />
                <select
                  value={selectedCircularId}
                  onChange={(e) => setSelectedCircularId(e.target.value)}
                  className="h-8 w-full cursor-pointer rounded-lg border border-border bg-background ps-8 pe-3 text-xs font-medium text-foreground transition-colors outline-none focus:border-primary sm:w-auto dark:bg-input/30"
                  aria-label={t("selectCircular")}
                >
                  <option value="all">{t("allCircularsSummary")}</option>
                  {data.circulars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.refNumber} - {c.title}
                    </option>
                  ))}
                </select>
              </div>
              {data.circularCount > data.circulars.length ? (
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  {t("showingRecentCirculars", {
                    shown: data.circulars.length,
                    total: data.circularCount,
                  })}
                </p>
              ) : null}
            </div>
          )}

          {canRemind ? (
            <CircularRemindButton
              circularId={selectedCircular?.id ?? null}
              circularTitle={selectedCircular?.title}
            />
          ) : null}
        </div>
      </div>

      <DashboardComplianceOverview
        label={selectedCircular ? selectedCircular.refNumber : t("overallCompliance")}
        counts={counts}
      />

      <DashboardComplianceDistribution slices={displayedSlices} />

      <DashboardComplianceDeptsCard responded={responded} pending={pending} />
    </div>
  );
}
