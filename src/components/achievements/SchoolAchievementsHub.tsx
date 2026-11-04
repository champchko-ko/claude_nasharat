"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AwardIcon } from "lucide-react";
import { CreateAchievementDialog } from "./CreateAchievementDialog";
import { AchievementFilterBar } from "./AchievementFilterBar";
import { AchievementList } from "./AchievementList";
import { filterAchievements } from "@/lib/achievements/filterAchievements";
import type { SchoolAchievementRow } from "@/lib/achievements/types";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

export function SchoolAchievementsHub({
  achievements,
  departments,
  canManage,
}: {
  achievements: SchoolAchievementRow[];
  departments: DepartmentRow[];
  canManage: boolean;
}) {
  const t = useTranslations("achievements");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const filtered = filterAchievements(achievements, {
    query: searchQuery,
    category: selectedCategory,
    departmentId: selectedDepartment,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{t("title")}</h2>
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <AwardIcon className="size-3.5" />
              <span>{achievements.length}</span>
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        {canManage && <CreateAchievementDialog departments={departments} />}
      </div>

      <AchievementFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        departments={departments}
      />

      <AchievementList achievements={filtered} departments={departments} canManage={canManage} />
    </div>
  );
}
