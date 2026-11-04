"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarDaysIcon } from "lucide-react";
import type { CalendarEventRow } from "@/lib/calendar/types";

export function PublicTopBarTicker({ events }: { events: CalendarEventRow[] }) {
  const locale = useLocale();
  const t = useTranslations("home");

  const tickerItems = events
    .slice(0, 6)
    .map((ev) => (locale === "ar" ? ev.title_ar : ev.title_en || ev.title_ar));

  if (tickerItems.length === 0) return null;

  return (
    <div className="border-t border-scrim-foreground/10 bg-scrim/15">
      <div className="mx-auto flex w-full max-w-[1720px] items-center gap-3.5 overflow-hidden px-4 py-1.5 sm:px-8 lg:px-12 xl:px-16">
        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-sidebar-primary px-4 py-2 text-xs font-extrabold text-sidebar-primary-foreground sm:text-sm">
          <CalendarDaysIcon className="size-4 text-sidebar-primary-foreground" />
          {t("tickerLabel")}
        </span>
        <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-sm font-bold text-sidebar-primary">
          <span className="animate-ticker">{tickerItems.join("   •   ")}</span>
        </div>
      </div>
    </div>
  );
}

