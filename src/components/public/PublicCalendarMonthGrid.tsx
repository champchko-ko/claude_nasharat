"use client";

import type { UnifiedCalendarItem } from "@/lib/calendar/types";
import { PublicCalendarDayButton } from "./PublicCalendarDayButton";
import { PublicCalendarLegend } from "./PublicCalendarLegend";

const WEEKDAYS_AR = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface PublicCalendarMonthGridProps {
  currentDate: Date;
  items: UnifiedCalendarItem[];
  selectedDate: Date | null;
  locale: string;
  onSelectDate: (date: Date) => void;
}

export function PublicCalendarMonthGrid({
  currentDate,
  items,
  selectedDate,
  locale,
  onSelectDate,
}: PublicCalendarMonthGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const weekdays = locale === "en" ? WEEKDAYS_EN : WEEKDAYS_AR;

  const cells: { day: number; isToday: boolean; isSelected: boolean; dayItems: UnifiedCalendarItem[] }[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ day: 0, isToday: false, isSelected: false, dayItems: [] });
  }

  for (let d = 1; d <= totalDays; d++) {
    const isToday =
      today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const isSelected =
      selectedDate !== null &&
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === d;

    const dayItems = items.filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getFullYear() === year &&
        itemDate.getMonth() === month &&
        itemDate.getDate() === d
      );
    });

    cells.push({ day: d, isToday, isSelected, dayItems });
  }

  return (
    <div className="flex flex-col justify-between bg-white dark:bg-card">
      <div>
        <div className="grid grid-cols-7 bg-[#0c1f44] py-2.5 text-center text-xs font-bold text-white sm:text-sm">
          {weekdays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1 p-3 sm:p-5">
          {cells.map((cell, idx) => (
            <PublicCalendarDayButton
              key={idx}
              day={cell.day}
              isToday={cell.isToday}
              isSelected={cell.isSelected}
              dayItems={cell.dayItems}
              onSelect={() => onSelectDate(new Date(year, month, cell.day))}
            />
          ))}
        </div>
      </div>

      <PublicCalendarLegend locale={locale} />
    </div>
  );
}

