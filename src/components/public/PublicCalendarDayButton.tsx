"use client";

import type { UnifiedCalendarItem } from "@/lib/calendar/types";
import { getPublicCalendarCategoryStyle } from "./getPublicCalendarCategoryStyle";

interface PublicCalendarDayButtonProps {
  day: number;
  isToday: boolean;
  isSelected: boolean;
  dayItems: UnifiedCalendarItem[];
  onSelect: () => void;
}

export function PublicCalendarDayButton({
  day,
  isToday,
  isSelected,
  dayItems,
  onSelect,
}: PublicCalendarDayButtonProps) {
  if (day === 0) {
    return <div className="h-10 sm:h-12" aria-hidden="true" />;
  }

  const primaryItem = dayItems[0];
  const rawCategory = primaryItem?.kind === "event" ? primaryItem.event.category : "bulletin";
  const primaryDot = primaryItem ? getPublicCalendarCategoryStyle(rawCategory).dotClass : null;

  const baseStyle = isSelected
    ? "bg-gradient-to-b from-[#e5a93b] to-[#c78f24] text-[#0c1f44] font-black shadow-md shadow-amber-500/25 scale-105"
    : isToday
      ? "bg-slate-100 text-slate-900 font-black border border-slate-300 dark:bg-slate-800 dark:text-white"
      : "text-slate-700 font-bold hover:bg-slate-100/90 dark:text-slate-200 dark:hover:bg-slate-800";

  return (
    <div className="flex h-11 items-center justify-center sm:h-13">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        className={`relative flex size-9 flex-col items-center justify-center rounded-xl text-sm transition-all sm:size-11 sm:text-base ${baseStyle}`}
      >
        <span>{day}</span>
        {primaryDot && (
          <span
            className={`absolute bottom-1 size-1.5 rounded-full ${isSelected ? "bg-[#0c1f44]" : primaryDot}`}
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}

