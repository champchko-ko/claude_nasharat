import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { FileTextIcon, WrenchIcon, CalendarIcon, InfoIcon } from "lucide-react";
import type { NotificationType } from "@/lib/notifications/types";

export function NotificationBadge({ type }: { type: NotificationType }) {
  const t = useTranslations("notifications.types");

  if (type === "circular") {
    return (
      <Badge variant="outline" className="gap-1 border-info/30 bg-info/10 text-info">
        <FileTextIcon className="size-3" />
        <span>{t("circular")}</span>
      </Badge>
    );
  }

  if (type === "maintenance") {
    return (
      <Badge variant="outline" className="gap-1 border-warning/30 bg-warning/10 text-warning">
        <WrenchIcon className="size-3" />
        <span>{t("maintenance")}</span>
      </Badge>
    );
  }

  if (type === "calendar") {
    return (
      <Badge variant="outline" className="gap-1 border-chart-3/30 bg-chart-3/10 text-chart-3">
        <CalendarIcon className="size-3" />
        <span>{t("calendar")}</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 border-muted-foreground/30 bg-muted text-muted-foreground"
    >
      <InfoIcon className="size-3" />
      <span>{t("system")}</span>
    </Badge>
  );
}
