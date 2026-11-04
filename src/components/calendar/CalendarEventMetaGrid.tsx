"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarIcon, ClockIcon, UserIcon, MapPinIcon } from "lucide-react";
import type { CalendarEventRow } from "@/lib/calendar/types";

export function CalendarEventMetaGrid({ event }: { event: CalendarEventRow }) {
  const locale = useLocale();
  const t = useTranslations("calendar");

  const startDate = new Date(event.starts_at);
  const endDate = new Date(event.ends_at);
  const formattedDate = startDate.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeRange = event.all_day
    ? t("allDayBadge")
    : `${startDate.toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })} – ${endDate.toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-3">
        <div className="flex items-center gap-2.5 text-xs">
          <CalendarIcon className="size-4 text-primary" />
          <div>
            <div className="text-muted-foreground">{t("startsAt")}</div>
            <div className="font-medium text-foreground">{formattedDate}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <ClockIcon className="size-4 text-primary" />
          <div>
            <div className="text-muted-foreground">{t("endsAt")}</div>
            <div className="font-medium text-foreground">{timeRange}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <UserIcon className="size-4 text-muted-foreground" />
          <div>
            <div className="text-muted-foreground">{t("creator")}</div>
            <div className="font-medium text-foreground">{event.creator?.full_name ?? "—"}</div>
          </div>
        </div>
      </div>

      {event.location && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPinIcon className="size-3.5" />
          <span>{event.location}</span>
        </div>
      )}
    </>
  );
}
