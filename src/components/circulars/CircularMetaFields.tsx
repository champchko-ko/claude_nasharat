import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CircularMetaFields() {
  const t = useTranslations("circulars");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5">
        <Label htmlFor="visibility">{t("visibility")}</Label>
        <select
          id="visibility"
          name="visibility"
          defaultValue="internal"
          className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="internal">{t("visibilityInternal")}</option>
          <option value="public">{t("visibilityPublic")}</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="priority">{t("priority")}</Label>
        <select
          id="priority"
          name="priority"
          defaultValue="normal"
          className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="urgent">{t("priorityUrgent")}</option>
          <option value="high">{t("priorityHigh")}</option>
          <option value="normal">{t("priorityNormal")}</option>
          <option value="low">{t("priorityLow")}</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="response_type">{t("responseType")}</Label>
        <select
          id="response_type"
          name="response_type"
          defaultValue="acknowledgement"
          className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="acknowledgement">{t("responseTypeAck")}</option>
          <option value="approval">{t("responseTypeApproval")}</option>
          <option value="task">{t("responseTypeTask")}</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="due_at">{t("dueDate")}</Label>
        <Input id="due_at" name="due_at" type="date" />
      </div>
    </div>
  );
}
