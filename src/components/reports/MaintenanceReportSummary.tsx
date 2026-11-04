import { useTranslations } from "next-intl";
import { WrenchIcon, ClockIcon, CheckCircle2Icon, TimerIcon } from "lucide-react";
import { ReportKpiCard } from "./ReportKpiCard";
import type { MaintenanceReportSummaryData } from "@/lib/reports/types";

export function MaintenanceReportSummary({ data }: { data: MaintenanceReportSummaryData }) {
  const t = useTranslations("reports.kpis");

  const resolutionDisplay =
    data.avgResolutionTimeHours !== null ? `${data.avgResolutionTimeHours} hrs` : "—";

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-12 pt-8 sm:grid-cols-2 lg:grid-cols-4">
      <ReportKpiCard title={t("totalTickets")} value={data.totalTickets} icon={WrenchIcon} />
      <ReportKpiCard
        title={t("openTickets")}
        value={data.openCount}
        icon={ClockIcon}
        trend={data.openCount > 10 ? "warning" : "good"}
      />
      <ReportKpiCard
        title={t("resolvedTickets")}
        value={data.resolvedCount}
        icon={CheckCircle2Icon}
        trend="good"
      />
      <ReportKpiCard
        title={t("avgResolutionTime")}
        value={resolutionDisplay}
        icon={TimerIcon}
        trend={
          data.avgResolutionTimeHours !== null && data.avgResolutionTimeHours > 48
            ? "warning"
            : "good"
        }
      />
    </div>
  );
}
