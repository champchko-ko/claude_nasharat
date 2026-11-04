"use client";

import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import type { SchoolAchievementRow } from "@/lib/achievements/types";

export function AchievementCategoryFields({
  departments,
  defaultValues,
}: {
  departments: DepartmentRow[];
  defaultValues?: Partial<SchoolAchievementRow>;
}) {
  const t = useTranslations("achievements");
  const locale = useLocale();
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="space-y-1.5">
        <Label htmlFor="ach_dept">{t("department")}</Label>
        <select
          id="ach_dept"
          name="department_id"
          defaultValue={defaultValues?.department_id ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          <option value="">{t("selectDepartment")}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {locale === "ar" ? d.name_ar : d.name_en}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ach_cat">{t("category")}</Label>
        <select
          id="ach_cat"
          name="category"
          defaultValue={defaultValues?.category ?? "academic"}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          <option value="academic">{t("categories.academic")}</option>
          <option value="competition">{t("categories.competition")}</option>
          <option value="scientific">{t("categories.scientific")}</option>
          <option value="sports">{t("categories.sports")}</option>
          <option value="community">{t("categories.community")}</option>
          <option value="other">{t("categories.other")}</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ach_date">{t("dateAchieved")}</Label>
        <Input
          id="ach_date"
          name="date_achieved"
          type="date"
          defaultValue={defaultValues?.date_achieved ?? today}
          required
        />
      </div>
    </div>
  );
}
