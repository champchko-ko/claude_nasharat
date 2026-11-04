"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

export function CreateUserDeptSelect({
  departmentId,
  setDepartmentId,
  departments,
  disabled,
}: {
  departmentId: string;
  setDepartmentId: (val: string) => void;
  departments: DepartmentRow[];
  disabled: boolean;
}) {
  const t = useTranslations("settings");

  return (
    <div className="space-y-1.5">
      <Label htmlFor="new_user_dept">{t("departments")}</Label>
      <select
        id="new_user_dept"
        value={departmentId}
        onChange={(e) => setDepartmentId(e.target.value)}
        disabled={disabled}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">— {t("chooseDepartment")} —</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name_ar} ({d.name_en})
          </option>
        ))}
      </select>
    </div>
  );
}
