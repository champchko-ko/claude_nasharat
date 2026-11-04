"use client";

import { useTranslations } from "next-intl";
import { GoldDots } from "@/components/ui/gold-dots";
import { CalendarEventCategoryBadge } from "./CalendarEventCategoryBadge";
import { CalendarEventStatusBadge } from "./CalendarEventStatusBadge";
import { CalendarVisibilityBadge } from "./CalendarVisibilityBadge";
import { CalendarActionButtons } from "./CalendarActionButtons";
import { CalendarEventMetaGrid } from "./CalendarEventMetaGrid";
import type { CalendarEventRow } from "@/lib/calendar/types";

export function CalendarEventDetailCard({
  event,
  canManage,
}: {
  event: CalendarEventRow;
  canManage: boolean;
}) {
  const t = useTranslations("calendar");

  return (
    <div className="relative space-y-6 overflow-hidden rounded-xl border border-border bg-card p-6 pt-8 shadow-[0_12px_30px_rgba(20,37,74,.10)]">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--action-from,#0b63d6),var(--action-to,#0a2f7a))]"
      />
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-primary">{event.title_ar}</h1>
          <div className="mt-2 h-0.5 w-24 rounded-full bg-[linear-gradient(90deg,var(--rule-from,#b88a2a),var(--action-to,#0a2f7a))]" />
          {event.title_en && (
            <p className="mt-0.5 text-sm text-muted-foreground">{event.title_en}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarEventCategoryBadge category={event.category} />
          <CalendarVisibilityBadge visibility={event.visibility} />
          <CalendarEventStatusBadge status={event.status} />
        </div>
      </div>

      {event.description && (
        <div className="space-y-1.5">
          <h3 className="flex items-center gap-2 text-xs font-extrabold text-primary">
            {t("eventDescription")}
            <GoldDots />
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {event.description}
          </p>
        </div>
      )}

      <CalendarEventMetaGrid event={event} />

      {canManage && (
        <div className="flex justify-end border-t border-border pt-4">
          <CalendarActionButtons eventId={event.id} status={event.status} canManage={canManage} />
        </div>
      )}
    </div>
  );
}
