"use client";

import { CalendarDaysIcon } from "lucide-react";
import type { UnifiedCalendarItem } from "@/lib/calendar/types";
import { PublicCalendarItemCard } from "./PublicCalendarItemCard";
import { filterUpcomingCalendarItems } from "./filterUpcomingCalendarItems";

interface PublicCalendarUpcomingListProps {
  items: UnifiedCalendarItem[];
  selectedDate: Date | null;
  locale: string;
  onClearDateFilter: () => void;
}

export function PublicCalendarUpcomingList({
  items,
  selectedDate,
  locale,
  onClearDateFilter,
}: PublicCalendarUpcomingListProps) {
  const isEn = locale === "en";
  const { displayItems, isShowingFallback } = filterUpcomingCalendarItems(items, selectedDate);

  return (
    <div className="flex flex-col gap-3.5 border-b border-slate-200/80 bg-slate-50/60 p-4 sm:p-6 lg:border-b-0 lg:border-e dark:border-slate-800 dark:bg-slate-900/30">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="size-5 text-[#e5a93b]" aria-hidden="true" />
          <h3 className="font-heading text-base font-bold text-[#0c1f44] sm:text-lg dark:text-white">
            {isEn ? "Upcoming Events & Bulletins" : "أحداث قادمة"}
          </h3>
        </div>
        {selectedDate && (
          <button
            type="button"
            onClick={onClearDateFilter}
            className="text-xs font-semibold text-[#c78f24] hover:underline"
          >
            {isEn ? "View all" : "عرض الكل"}
          </button>
        )}
      </div>

      {isShowingFallback && selectedDate && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-3 text-center text-xs text-muted-foreground dark:border-slate-700 dark:bg-card">
          {isEn
            ? "No events on selected date. Showing upcoming schedule:"
            : "لا توجد فعاليات في اليوم المحدد. المعروض أدناه هو الأحداث القادمة:"}
        </p>
      )}

      {displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-muted-foreground dark:border-slate-700">
          <p>{isEn ? "No public events scheduled." : "لا توجد فعاليات أو نشرات عامة حالياً."}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayItems.map((item) => (
            <PublicCalendarItemCard key={`${item.kind}-${item.id}`} item={item} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
