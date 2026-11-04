import { useTranslations } from "next-intl";
import { BellOffIcon } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import type { NotificationRow } from "@/lib/notifications/types";

export function NotificationList({ notifications }: { notifications: NotificationRow[] }) {
  const t = useTranslations("notifications");

  if (!notifications.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <BellOffIcon className="size-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-foreground">{t("empty")}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("emptyDesc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
