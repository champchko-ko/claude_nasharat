import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CircularPriority, CircularStatus, CircularVisibility } from "@/lib/circulars/types";
import { EditCircularVisibilityField } from "./EditCircularVisibilityField";

export function EditCircularFieldsGrid({
  priority,
  visibility = "internal",
  status,
  dueAt,
}: {
  priority: CircularPriority;
  visibility?: CircularVisibility;
  status: CircularStatus;
  dueAt?: string | null;
}) {
  const t = useTranslations("circulars");

  const priorityLabels: Record<CircularPriority, string> = {
    low: t("low"),
    normal: t("normal"),
    high: t("high"),
    urgent: t("urgent"),
  };

  const statusLabels: Record<CircularStatus, string> = {
    draft: t("draft"),
    published: t("published"),
    in_progress: t("inProgress"),
    completed: t("completed"),
    overdue: t("overdue"),
    archived: t("archived"),
    cancelled: t("statusCancelled"),
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <EditCircularVisibilityField visibility={visibility} />

      <div className="space-y-2">
        <Label htmlFor="priority">{t("priority")}</Label>
        <Select name="priority" defaultValue={priority}>
          <SelectTrigger id="priority" className="w-full">
            <SelectValue>{priorityLabels[priority]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">{t("low")}</SelectItem>
            <SelectItem value="normal">{t("normal")}</SelectItem>
            <SelectItem value="high">{t("high")}</SelectItem>
            <SelectItem value="urgent">{t("urgent")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">{t("status")}</Label>
        <Select name="status" defaultValue={status}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue>{statusLabels[status]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">{t("draft")}</SelectItem>
            <SelectItem value="published">{t("published")}</SelectItem>
            <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
            <SelectItem value="completed">{t("completed")}</SelectItem>
            <SelectItem value="overdue">{t("overdue")}</SelectItem>
            <SelectItem value="archived">{t("archived")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="due_at">{t("dueDate")}</Label>
        <Input
          id="due_at"
          name="due_at"
          type="date"
          defaultValue={dueAt ? dueAt.split("T")[0] : ""}
        />
      </div>
    </div>
  );
}
