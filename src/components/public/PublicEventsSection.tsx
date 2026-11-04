"use client";

import { useLocale, useTranslations } from "next-intl";
import type { CalendarEventRow } from "@/lib/calendar/types";
import type { CircularRow } from "@/lib/circulars/types";
import { buildUnifiedCalendarItems } from "@/lib/calendar/buildUnifiedCalendarItems";
import { PublicCalendarWidget } from "./PublicCalendarWidget";

interface PublicEventsSectionProps {
  events: CalendarEventRow[];
  circulars?: CircularRow[];
}

export function PublicEventsSection({ events, circulars = [] }: PublicEventsSectionProps) {
  const locale = useLocale();
  const t = useTranslations("home");

  const unifiedItems = buildUnifiedCalendarItems(events, circulars);

  return (
    <section id="events" className="border-t border-border/60 py-20 px-4 sm:px-8 lg:px-12 xl:px-16">
      <div className="mx-auto w-full max-w-[1520px] space-y-8 animate-hero-fade-up delay-750">
        <div className="space-y-3 text-center">
          <h2 className="font-heading text-2xl font-black text-[#0c1f44] sm:text-3xl lg:text-4xl dark:text-white">
            {t("publicCalendar")}
          </h2>
          <div className="mx-auto h-1 w-12 rounded-full bg-[#e5a93b]" aria-hidden="true" />
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("publicCalendarDesc")}
          </p>
        </div>

        <PublicCalendarWidget items={unifiedItems} locale={locale} />
      </div>
    </section>
  );
}
