"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n";
import { BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const t = useTranslations("notifications");

  return (
    <Link href="/notifications">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        aria-label={t("title")}
      >
        <BellIcon className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute end-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}
