"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CircularStatusFilter({
  status,
  onStatusChange,
}: {
  status: string;
  onStatusChange: (v: string) => void;
}) {
  const t = useTranslations("circulars");

  const statusLabels: Record<string, string> = {
    all: t("allStatuses"),
    draft: t("draft"),
    published: t("published"),
    in_progress: t("inProgress"),
    completed: t("completed"),
    overdue: t("overdue"),
    archived: t("archived"),
  };

  return (
    <Select value={status} onValueChange={(val) => onStatusChange(val || "all")}>
      <SelectTrigger className="w-36">
        <SelectValue placeholder={t("allStatuses")}>
          {statusLabels[status] ?? t("allStatuses")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("allStatuses")}</SelectItem>
        <SelectItem value="draft">{t("draft")}</SelectItem>
        <SelectItem value="published">{t("published")}</SelectItem>
        <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
        <SelectItem value="completed">{t("completed")}</SelectItem>
        <SelectItem value="overdue">{t("overdue")}</SelectItem>
        <SelectItem value="archived">{t("archived")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
