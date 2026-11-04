"use client";

import type { SchoolAchievementRow } from "@/lib/achievements/types";

/** Achievement list of the trial dashboard stat modal. */
export function NewDashboardAchievementList({
  achievements,
}: {
  achievements: SchoolAchievementRow[];
}) {
  return (
    <div className="space-y-2">
      {achievements.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between rounded-lg border bg-muted/30 p-2.5"
        >
          <div>
            <div className="text-xs font-bold text-foreground">{a.title_ar}</div>
            <div className="text-[10px] text-muted-foreground">{a.description}</div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600">🏆 موثق</span>
        </div>
      ))}
    </div>
  );
}
