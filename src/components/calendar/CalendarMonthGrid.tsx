"use client";

import { CalendarMonthDayCell } from "./CalendarMonthDayCell";
import type { UnifiedCalendarItem } from "@/lib/calendar/types";

type CalendarMonthGridProps = {
  currentDate: Date;
  items: UnifiedCalendarItem[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
};

export function CalendarMonthGrid({
  currentDate,
  items,
  selectedDate,
  onSelectDate,
}: CalendarMonthGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({
      day: 0,
      isToday: false,
      isSelected: false,
      isWeekend: false,
      dayItems: [] as UnifiedCalendarItem[],
    });
  }

  for (let d = 1; d <= totalDays; d++) {
    const isToday =
      today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const isSelected =
      selectedDate !== null &&
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === d;
    const dayOfWeek = (firstDayIndex + d - 1) % 7;
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    const dayItems = items.filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getFullYear() === year && itemDate.getMonth() === month && itemDate.getDate() === d
      );
    });

    cells.push({ day: d, isToday, isSelected, isWeekend, dayItems });
  }

  return (
    <div className="grid grid-cols-7 gap-y-1 bg-[color:var(--panel,var(--muted))] px-2 py-3 sm:px-4">
      {cells.map((cell, idx) => (
        <CalendarMonthDayCell
          key={idx}
          day={cell.day}
          isToday={cell.isToday}
          isSelected={cell.isSelected}
          isWeekend={cell.isWeekend}
          dayItems={cell.dayItems}
          onSelect={() => onSelectDate(new Date(year, month, cell.day))}
        />
      ))}
    </div>
  );
}
