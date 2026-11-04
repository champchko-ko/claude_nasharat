"use client";

import { useLocale, useTranslations } from "next-intl";
import { Building2Icon, CalendarIcon, AwardIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AchievementCategoryBadge } from "./AchievementCategoryBadge";
import type { SchoolAchievementRow } from "@/lib/achievements/types";

export function AchievementCard({
  achievement,
  onClick,
}: {
  achievement: SchoolAchievementRow;
  onClick: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("achievements");

  const deptName = achievement.department
    ? locale === "ar"
      ? achievement.department.name_ar
      : achievement.department.name_en
    : null;

  const formattedDate = new Date(achievement.date_achieved).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    { dateStyle: "medium" },
  );

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
    >
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <AchievementCategoryBadge category={achievement.category} />
          {achievement.visibility === "public" && (
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
              <AwardIcon className="size-3" />
              <span>{t("publicBadge")}</span>
            </span>
          )}
        </div>

        <div>
          <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
            {achievement.title_ar}
          </h3>
          {achievement.title_en && (
            <p className="mt-0.5 text-xs text-muted-foreground">{achievement.title_en}</p>
          )}
        </div>

        {achievement.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {achievement.description}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          {deptName ? (
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Building2Icon className="size-3.5 text-primary" />
              <span>{deptName}</span>
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-1">
            <CalendarIcon className="size-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
