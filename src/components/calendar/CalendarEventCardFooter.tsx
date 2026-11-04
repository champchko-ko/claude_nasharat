"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarIcon, ClockIcon, MapPinIcon } from "lucide-react";
import type { CalendarEventRow } from "@/lib/calendar/types";

export function CalendarEventCardFooter({ event }: { event: CalendarEventRow }) {
  const locale = useLocale();
  const t = useTranslations("calendar");
  const intlLocale = locale === "ar" ? "ar-EG" : "en-US";

  const startDate = new Date(event.starts_at);
  const dateLabel = startDate.toLocaleDateString(intlLocale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = event.all_day
    ? t("allDayBadge")
    : startDate.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="size-4" />
          {dateLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <ClockIcon className="size-4" />
          {timeLabel}
        </span>
      </span>
      {event.location && (
        <span className="flex max-w-full items-center gap-1.5 text-xs font-medium">
          <MapPinIcon className="size-3.5 shrink-0" />
          <span className="truncate">{event.location}</span>
        </span>
      )}
    </>
  );
}
