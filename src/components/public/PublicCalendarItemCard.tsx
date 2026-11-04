"use client";

import { MapPinIcon } from "lucide-react";
import type { UnifiedCalendarItem } from "@/lib/calendar/types";
import { PublicCalendarDateBadge } from "./PublicCalendarDateBadge";
import { resolvePublicCalendarItemDetails } from "./resolvePublicCalendarItemDetails";

interface PublicCalendarItemCardProps {
  item: UnifiedCalendarItem;
  locale: string;
}

export function PublicCalendarItemCard({ item, locale }: PublicCalendarItemCardProps) {
  const { title, location, categoryLabel, pillClass } = resolvePublicCalendarItemDetails(
    item,
    locale,
  );

  return (
    <article className="group flex items-center justify-between gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-card">
      <div className="min-w-0 flex-1 space-y-1.5 text-start">
        <h3 className="line-clamp-2 text-sm font-bold text-foreground sm:text-base">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPinIcon className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="truncate">{location}</span>
        </div>
        <div className="pt-0.5">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pillClass}`}
          >
            {categoryLabel}
          </span>
        </div>
      </div>
      <PublicCalendarDateBadge date={item.date} locale={locale} />
    </article>
  );
}
