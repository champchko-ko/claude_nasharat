"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
import { SendIcon, BanIcon, ArchiveIcon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publishCalendarEventAction } from "@/actions/calendar/publishCalendarEventAction";
import { cancelCalendarEventAction } from "@/actions/calendar/cancelCalendarEventAction";
import { archiveCalendarEventAction } from "@/actions/calendar/archiveCalendarEventAction";
import type { CalendarStatus } from "@/lib/calendar/types";

export function CalendarActionButtons({
  eventId,
  status,
  canManage,
}: {
  eventId: string;
  status: CalendarStatus;
  canManage: boolean;
}) {
  const t = useTranslations("calendar.actions");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  if (!canManage) return null;

  const executeAction = (action: (id: string) => Promise<{ success: boolean; error?: string }>) => {
    startTransition(async () => {
      const res = await action(eventId);
      if (res.success) toast.success(tCommon("saved"));
      else toast.error(res.error || tCommon("error"));
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "archived" && (
        <Link href={`/${locale}/calendar/${eventId}/edit`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <PencilIcon className="size-3.5" />
            <span>{t("edit")}</span>
          </Button>
        </Link>
      )}

      {status === "draft" && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => executeAction(publishCalendarEventAction)}
          className="gap-1.5 bg-success text-success-foreground"
        >
          <SendIcon className="size-3.5 rtl:rotate-180" />
          <span>{t("publish")}</span>
        </Button>
      )}

      {status === "published" && (
        <>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => executeAction(cancelCalendarEventAction)}
            className="gap-1.5 text-destructive"
          >
            <BanIcon className="size-3.5" />
            <span>{t("cancel")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => executeAction(archiveCalendarEventAction)}
            className="gap-1.5 text-muted-foreground"
          >
            <ArchiveIcon className="size-3.5" />
            <span>{t("archive")}</span>
          </Button>
        </>
      )}
    </div>
  );
}
