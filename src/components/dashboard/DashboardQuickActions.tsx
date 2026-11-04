"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { PlusIcon, FileTextIcon, WrenchIcon, CalendarPlusIcon, AwardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoldDots } from "@/components/ui/gold-dots";
import { PANEL } from "@/components/ui/diamond-card-styles";

export function DashboardQuickActions({
  canCreateCircular,
  canCreateMaintenance,
  canCreateCalendar,
  canManageAchievements = false,
}: {
  canCreateCircular: boolean;
  canCreateMaintenance: boolean;
  canCreateCalendar: boolean;
  canManageAchievements?: boolean;
}) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <div
      className={`${PANEL} flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between`}
    >
      <div className="flex items-center gap-2.5">
        <PlusIcon className="size-4 text-primary" />
        <span className="font-heading text-base font-extrabold text-primary">
          {t("quickActions")}
        </span>
        <GoldDots />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canCreateCircular && (
          <Link href={`/${locale}/circulars/new`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <FileTextIcon className="size-3.5 text-info" />
              <span>{t("newCircular")}</span>
            </Button>
          </Link>
        )}

        {canCreateMaintenance && (
          <Link href={`/${locale}/maintenance/new`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <WrenchIcon className="size-3.5 text-warning" />
              <span>{t("newMaintenance")}</span>
            </Button>
          </Link>
        )}

        {canCreateCalendar && (
          <Link href={`/${locale}/calendar/new`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <CalendarPlusIcon className="size-3.5 text-chart-3" />
              <span>{t("newEvent")}</span>
            </Button>
          </Link>
        )}

        {canManageAchievements && (
          <Link href={`/${locale}/achievements`}>
            <Button size="sm" className="gap-1.5 text-xs">
              <AwardIcon className="size-3.5" />
              <span>{t("registerAchievement")}</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
