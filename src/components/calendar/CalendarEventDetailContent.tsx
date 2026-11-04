"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLinkIcon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarEventCategoryBadge } from "./CalendarEventCategoryBadge";
import { CalendarEventStatusBadge } from "./CalendarEventStatusBadge";
import { CalendarVisibilityBadge } from "./CalendarVisibilityBadge";
import { CalendarEventImageBanner } from "./CalendarEventImageBanner";
import { CalendarEventMetaGrid } from "./CalendarEventMetaGrid";
import type { CalendarEventRow } from "@/lib/calendar/types";

export function CalendarEventDetailContent({
  event,
  canManage = false,
  onClose,
}: {
  event: CalendarEventRow;
  canManage?: boolean;
  onClose: () => void;
}) {
  const locale = useLocale();
  const tCal = useTranslations("calendar");
  const tCommon = useTranslations("common");

  return (
    <div className="mt-5 space-y-5">
      <CalendarEventImageBanner imagePath={event.image_path} altText={event.title_ar} />
      <div className="flex flex-wrap items-center gap-2">
        <CalendarEventCategoryBadge category={event.category} />
        <CalendarVisibilityBadge visibility={event.visibility} />
        <CalendarEventStatusBadge status={event.status} />
      </div>

      <CalendarEventMetaGrid event={event} />

      {event.description && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {tCal("eventDescription")}
          </h4>
          <p className="rounded-lg border border-border bg-background p-3 text-sm whitespace-pre-wrap text-foreground">
            {event.description}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-2">
        <Button variant="outline" onClick={onClose}>
          {tCommon("cancel")}
        </Button>
        {canManage && (
          <Link href={`/${locale}/calendar/${event.id}/edit`}>
            <Button variant="outline" className="gap-1.5">
              <PencilIcon className="size-4" />
              <span>{tCal("actions.edit")}</span>
            </Button>
          </Link>
        )}
        <Link href={`/${locale}/calendar/${event.id}`}>
          <Button className="gap-2">
            <ExternalLinkIcon className="size-4" />
            <span>{tCal("actions.viewFull")}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
