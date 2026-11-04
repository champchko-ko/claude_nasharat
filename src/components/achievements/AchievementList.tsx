"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TrophyIcon } from "lucide-react";
import { AchievementCard } from "./AchievementCard";
import { AchievementDetailDialog } from "./AchievementDetailDialog";
import { CreateAchievementDialog } from "./CreateAchievementDialog";
import type { SchoolAchievementRow } from "@/lib/achievements/types";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

export function AchievementList({
  achievements,
  departments,
  canManage,
}: {
  achievements: SchoolAchievementRow[];
  departments: DepartmentRow[];
  canManage: boolean;
}) {
  const t = useTranslations("achievements");
  const [selectedAchievement, setSelectedAchievement] = useState<SchoolAchievementRow | null>(null);

  if (achievements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
        <TrophyIcon className="mb-3 size-12 text-muted-foreground/40" />
        <h3 className="text-base font-bold text-foreground">{t("empty")}</h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{t("emptyDesc")}</p>
        {canManage && (
          <div className="mt-4">
            <CreateAchievementDialog departments={departments} />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((item) => (
          <AchievementCard
            key={item.id}
            achievement={item}
            onClick={() => setSelectedAchievement(item)}
          />
        ))}
      </div>

      <AchievementDetailDialog
        achievement={selectedAchievement}
        departments={departments}
        canManage={canManage}
        onClose={() => setSelectedAchievement(null)}
      />
    </>
  );
}
