"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

export function CircularDepartmentFilter({
  departmentId,
  onDepartmentChange,
  departments,
}: {
  departmentId: string;
  onDepartmentChange: (v: string) => void;
  departments: DepartmentRow[];
}) {
  const t = useTranslations("circulars");

  const currentDept = departments.find((d) => d.id === departmentId);
  const departmentLabel =
    departmentId === "all" || !currentDept
      ? t("allDepartments")
      : currentDept.name_ar || currentDept.name_en;

  return (
    <Select value={departmentId} onValueChange={(val) => onDepartmentChange(val || "all")}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder={t("allDepartments")}>{departmentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("allDepartments")}</SelectItem>
        {departments.map((dept) => (
          <SelectItem key={dept.id} value={dept.id}>
            {dept.name_ar || dept.name_en}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
