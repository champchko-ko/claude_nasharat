"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CircularPriorityFilter({
  priority,
  onPriorityChange,
}: {
  priority: string;
  onPriorityChange: (v: string) => void;
}) {
  const t = useTranslations("circulars");

  const priorityLabels: Record<string, string> = {
    all: t("allPriorities"),
    urgent: t("urgent"),
    high: t("high"),
    normal: t("normal"),
    low: t("low"),
  };

  return (
    <Select value={priority} onValueChange={(val) => onPriorityChange(val || "all")}>
      <SelectTrigger className="w-32">
        <SelectValue placeholder={t("allPriorities")}>
          {priorityLabels[priority] ?? t("allPriorities")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("allPriorities")}</SelectItem>
        <SelectItem value="urgent">{t("urgent")}</SelectItem>
        <SelectItem value="high">{t("high")}</SelectItem>
        <SelectItem value="normal">{t("normal")}</SelectItem>
        <SelectItem value="low">{t("low")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
