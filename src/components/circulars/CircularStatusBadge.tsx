import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import type { CircularStatus } from "@/lib/circulars/types";

export function CircularStatusBadge({ status }: { status: CircularStatus }) {
  const t = useTranslations("circulars");

  const labels: Record<CircularStatus, string> = {
    draft: t("statusDraft"),
    published: t("statusPublished"),
    in_progress: t("statusInProgress"),
    completed: t("statusCompleted"),
    overdue: t("statusOverdue"),
    archived: t("statusArchived"),
    cancelled: t("statusCancelled"),
  };

  const variant =
    status === "published" || status === "completed"
      ? "default"
      : status === "overdue" || status === "cancelled"
        ? "destructive"
        : "outline";

  return <Badge variant={variant}>{labels[status]}</Badge>;
}
