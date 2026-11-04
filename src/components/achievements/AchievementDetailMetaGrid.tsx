"use client";

import { useLocale, useTranslations } from "next-intl";
import { Building2Icon, CalendarIcon, UserIcon } from "lucide-react";
import type { SchoolAchievementRow } from "@/lib/achievements/types";

export function AchievementDetailMetaGrid({ achievement }: { achievement: SchoolAchievementRow }) {
  const t = useTranslations("achievements");
  const locale = useLocale();

  const deptName = achievement.department
    ? locale === "ar"
      ? achievement.department.name_ar
      : achievement.department.name_en
    : "—";

  const formattedDate = new Date(achievement.date_achieved).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    { dateStyle: "long" },
  );

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg bg-muted/40 p-3.5 text-xs sm:grid-cols-3">
      <div className="flex items-center gap-2">
        <Building2Icon className="size-4 shrink-0 text-primary" />
        <div>
          <div className="text-muted-foreground">{t("department")}</div>
          <div className="font-semibold text-foreground">{deptName}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <CalendarIcon className="size-4 shrink-0 text-primary" />
        <div>
          <div className="text-muted-foreground">{t("dateAchieved")}</div>
          <div className="font-semibold text-foreground">{formattedDate}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <UserIcon className="size-4 shrink-0 text-muted-foreground" />
        <div>
          <div className="text-muted-foreground">{t("recordedBy")}</div>
          <div className="font-semibold text-foreground">
            {achievement.creator?.full_name ?? "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
