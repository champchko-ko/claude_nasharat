"use client";

import { useLocale, useTranslations } from "next-intl";
import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildAchievementCategoryOptions } from "./buildAchievementCategoryOptions";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

export function AchievementFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDepartment,
  onDepartmentChange,
  departments,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (deptId: string) => void;
  departments: DepartmentRow[];
}) {
  const t = useTranslations("achievements");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const categories = buildAchievementCategoryOptions(t);

  const hasActiveFilters =
    searchQuery !== "" || selectedCategory !== "all" || selectedDepartment !== "all";

  const clearFilters = () => {
    onSearchChange("");
    onCategoryChange("all");
    onDepartmentChange("all");
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-xs">
        <SearchIcon className="absolute start-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder={t("titleAr")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 ps-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedDepartment}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          <option value="all">{t("allDepartments")}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {locale === "ar" ? d.name_ar : d.name_en}
            </option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1 text-xs">
            <XIcon className="size-3.5" />
            <span>{tCommon("clear")}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
