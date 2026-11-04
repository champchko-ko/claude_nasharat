"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

export function DashboardComplianceDeptsCard({
  responded,
  pending,
}: {
  responded: Array<{ id: string; name: string }>;
  pending: Array<{ id: string; name: string; outstanding: number }>;
}) {
  const t = useTranslations("dashboard");

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <div className="flex flex-col gap-2 rounded-xl border border-success/25 bg-success/5 p-3.5 shadow-2xs transition-colors dark:border-success/20 dark:bg-success/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-success">
            {t("respondedDepartments")} ({responded.length})
          </span>
          <span className="size-2 animate-pulse rounded-full bg-success" />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {responded.length > 0 ? (
            responded.map((d) => (
              <Badge
                key={d.id}
                variant="secondary"
                className="border-success/30 bg-success/15 text-[11px] font-semibold text-success transition-transform hover:scale-105 dark:text-success"
              >
                {d.name}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3.5 shadow-2xs transition-colors dark:border-destructive/20 dark:bg-destructive/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-destructive">
            {t("pendingDepartments")} ({pending.length})
          </span>
          {pending.length > 0 ? (
            <span className="size-2 rounded-full bg-destructive" />
          ) : (
            <span className="text-xs font-bold text-success">✓</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {pending.length > 0 ? (
            pending.map((d) => (
              <Badge
                key={d.id}
                variant="destructive"
                className="border-destructive/30 bg-destructive/15 text-[11px] font-semibold text-destructive transition-transform hover:scale-105 dark:text-destructive"
              >
                {d.name}
                {d.outstanding > 0 ? ` · ${d.outstanding}` : ""}
              </Badge>
            ))
          ) : (
            <span className="text-xs font-medium text-success">{t("allResponded")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
