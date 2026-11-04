"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AchievementCategoryFields } from "./AchievementCategoryFields";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import type { SchoolAchievementRow } from "@/lib/achievements/types";

export function AchievementFormFields({
  departments,
  defaultValues,
}: {
  departments: DepartmentRow[];
  defaultValues?: Partial<SchoolAchievementRow>;
}) {
  const t = useTranslations("achievements");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ach_title_ar">{t("titleAr")} *</Label>
          <Input
            id="ach_title_ar"
            name="title_ar"
            defaultValue={defaultValues?.title_ar ?? ""}
            required
            placeholder="مثال: المركز الأول في مسابقة الروبوت"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ach_title_en">{t("titleEn")}</Label>
          <Input
            id="ach_title_en"
            name="title_en"
            defaultValue={defaultValues?.title_en ?? ""}
            placeholder="e.g. 1st Place Robotics Competition"
          />
        </div>
      </div>

      <AchievementCategoryFields departments={departments} defaultValues={defaultValues} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ach_vis">{t("visibility")}</Label>
          <select
            id="ach_vis"
            name="visibility"
            defaultValue={defaultValues?.visibility ?? "internal"}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            <option value="internal">{t("internal")}</option>
            <option value="public">{t("public")}</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ach_img">{t("certificate")}</Label>
          <Input id="ach_img" name="image" type="file" accept="image/jpeg,image/png,image/webp" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ach_desc">{t("description")}</Label>
        <Textarea
          id="ach_desc"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          rows={3}
          placeholder="تفاصيل الإنجاز ومضمونه..."
        />
      </div>
    </div>
  );
}
