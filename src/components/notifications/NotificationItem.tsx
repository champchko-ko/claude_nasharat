"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n";
import { toast } from "sonner";
import { CheckIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "./NotificationBadge";
import { resolveNotificationHref } from "@/lib/notifications/resolveNotificationHref";
import { resolveNotificationText } from "@/lib/notifications/resolveNotificationText";
import { markNotificationReadAction } from "@/actions/notifications/markNotificationReadAction";
import type { NotificationRow } from "@/lib/notifications/types";

export function NotificationItem({ notification }: { notification: NotificationRow }) {
  const t = useTranslations("notifications");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isUnread = !notification.read_at;
  const href = resolveNotificationHref(notification);
  const content = resolveNotificationText(notification, t);
  const formattedDate = new Date(notification.created_at).toLocaleString(
    locale === "ar" ? "ar-EG" : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

  const handleMarkRead = () => {
    startTransition(async () => {
      const res = await markNotificationReadAction(notification.id);
      if (res.success) {
        toast.success(tCommon("saved"));
        router.refresh();
      } else {
        toast.error(res.error ?? tCommon("error"));
      }
    });
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
        isUnread
          ? "border-primary/40 bg-primary/5 shadow-xs"
          : "border-border bg-card hover:bg-muted/40"
      }`}
    >
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <NotificationBadge type={notification.type} />
          {isUnread && <span className="size-2 rounded-full bg-primary" aria-label={t("unread")} />}
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
        <h4 className="text-sm font-semibold text-foreground">{content.title}</h4>
        {content.body && (
          <p className="text-xs leading-relaxed text-muted-foreground">{content.body}</p>
        )}
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        {isUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkRead}
            disabled={isPending}
            className="gap-1 text-xs"
          >
            <CheckIcon className="size-3.5" />
            <span>{t("markRead")}</span>
          </Button>
        )}
        {href && (
          <Link href={href}>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <span>{t("viewDetails")}</span>
              <ExternalLinkIcon className="size-3.5" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
