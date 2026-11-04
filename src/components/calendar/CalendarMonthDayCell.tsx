"use client";

import type { UnifiedCalendarItem } from "@/lib/calendar/types";
import { getCalendarDayCellStyles } from "./getCalendarDayCellStyles";

type CalendarMonthDayCellProps = {
  day: number;
  isToday: boolean;
  isSelected: boolean;
  isWeekend?: boolean;
  dayItems: UnifiedCalendarItem[];
  onSelect: () => void;
};

export function CalendarMonthDayCell({
  day,
  isToday,
  isSelected,
  isWeekend,
  dayItems,
  onSelect,
}: CalendarMonthDayCellProps) {
  if (day === 0) return <div className="h-14 sm:h-16" />;

  const hasEvents = dayItems.some((i) => i.kind === "event");
  const hasCirculars = dayItems.some((i) => i.kind === "circular");
  const { cellClass, eventDotClass, circularDotClass } = getCalendarDayCellStyles({
    isToday,
    isSelected,
    isWeekend,
  });
  const title = isWeekend ? "Official Weekend / عطلة رسمية" : undefined;

  return (
    <div className="flex h-14 items-center justify-center sm:h-16">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        title={title}
        className={`relative flex size-11 flex-col items-center justify-center rounded-lg text-sm font-bold transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:size-12 sm:text-base ${cellClass}`}
      >
        <span>{day}</span>
        {(hasEvents || hasCirculars) && (
          <span aria-hidden="true" className="absolute bottom-1.5 flex gap-0.5">
            {hasEvents && <i className={`size-1.5 rounded-full ${eventDotClass}`} />}
            {hasCirculars && <i className={`size-1.5 rounded-full ${circularDotClass}`} />}
          </span>
        )}
      </button>
    </div>
  );
}
