"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/cn";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

export function DepartmentTargetItem({
  dept,
  checked,
  onToggle,
}: {
  dept: DepartmentRow;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  const locale = useLocale();
  const deptName = locale === "ar" ? dept.name_ar || dept.name_en : dept.name_en || dept.name_ar;

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-xs transition-colors hover:bg-accent",
        checked ? "border-primary/50 bg-primary/5" : "border-border",
      )}
    >
      <input
        type="checkbox"
        name="department_ids"
        value={dept.id}
        checked={checked}
        onChange={() => onToggle(dept.id)}
        className="rounded border-border text-primary focus:ring-primary"
      />
      <span className="truncate">{deptName}</span>
    </label>
  );
}
