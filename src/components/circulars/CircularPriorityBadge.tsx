import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import type { CircularPriority } from "@/lib/circulars/types";

export function CircularPriorityBadge({ priority }: { priority: CircularPriority }) {
  const t = useTranslations("circulars");

  const labels: Record<CircularPriority, string> = {
    urgent: t("priorityUrgent"),
    high: t("priorityHigh"),
    normal: t("priorityNormal"),
    low: t("priorityLow"),
  };

  const variant =
    priority === "urgent" || priority === "high"
      ? "destructive"
      : priority === "normal"
        ? "default"
        : "secondary";

  return <Badge variant={variant}>{labels[priority]}</Badge>;
}
