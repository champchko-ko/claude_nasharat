"use client";

import { useState } from "react";
import type { UnifiedCalendarItem } from "@/lib/calendar/types";
import { PublicCalendarTopBar } from "./PublicCalendarTopBar";
import { PublicCalendarUpcomingList } from "./PublicCalendarUpcomingList";
import { PublicCalendarMonthGrid } from "./PublicCalendarMonthGrid";

interface PublicCalendarWidgetProps {
  items: UnifiedCalendarItem[];
  locale: string;
}

export function PublicCalendarWidget({ items, locale }: PublicCalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());

  const handlePrevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl dark:border-slate-800 dark:bg-card">
      <PublicCalendarTopBar
        currentDate={currentDate}
        locale={locale}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <PublicCalendarUpcomingList
            items={items}
            selectedDate={selectedDate}
            locale={locale}
            onClearDateFilter={() => setSelectedDate(null)}
          />
        </div>
        <div className="lg:col-span-7">
          <PublicCalendarMonthGrid
            currentDate={currentDate}
            items={items}
            selectedDate={selectedDate}
            locale={locale}
            onSelectDate={setSelectedDate}
          />
        </div>
      </div>
    </div>
  );
}

