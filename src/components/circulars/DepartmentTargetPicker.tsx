"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCheckIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { DepartmentTargetItem } from "./DepartmentTargetItem";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

export function DepartmentTargetPicker({
  departments,
  label,
  initialSelectedIds,
}: {
  departments: DepartmentRow[];
  label: string;
  initialSelectedIds?: string[];
}) {
  const t = useTranslations("circulars");
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds ?? []);

  const allDeptIds = departments.map((d) => d.id);
  const isAllSelected = departments.length > 0 && selectedIds.length === departments.length;

  const handleToggleAll = () => {
    setSelectedIds(isAllSelected ? [] : allDeptIds);
  };

  const handleToggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {departments.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleToggleAll}
            className="h-7 gap-1.5 text-xs"
          >
            <CheckCheckIcon className="size-3.5 text-primary" />
            <span>{isAllSelected ? t("deselectAll") : t("selectAll")}</span>
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {departments.length > 0 ? (
          <label
            className={cn(
              "col-span-2 flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-xs font-semibold transition-colors sm:col-span-3",
              isAllSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-dashed border-border hover:bg-accent",
            )}
          >
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleToggleAll}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span>
              {t("allDepartments")} ({departments.length})
            </span>
          </label>
        ) : null}

        {departments.map((dept) => (
          <DepartmentTargetItem
            key={dept.id}
            dept={dept}
            checked={selectedIds.includes(dept.id)}
            onToggle={handleToggleOne}
          />
        ))}
      </div>
    </div>
  );
}
