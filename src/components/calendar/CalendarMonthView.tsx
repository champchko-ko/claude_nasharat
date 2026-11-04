"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { CalendarMonthGrid } from "./CalendarMonthGrid";
import { CalendarMonthSelectedPanel } from "./CalendarMonthSelectedPanel";
import type { UnifiedCalendarItem } from "@/lib/calendar/types";

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const BAR =
  "bg-[linear-gradient(90deg,var(--topbar-from,var(--sidebar)),var(--topbar-to,var(--sidebar)))] text-sidebar-foreground";

const NAV_BUTTON =
  "flex size-9 items-center justify-center rounded-md bg-sidebar-foreground/10 text-sidebar-foreground transition-colors hover:bg-sidebar-foreground/20 focus-visible:outline-2 focus-visible:outline-sidebar-primary";

type CalendarMonthViewProps = {
  items: UnifiedCalendarItem[];
  onSelectItem?: (item: UnifiedCalendarItem) => void;
  onViewMore?: () => void;
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarMonthView({ items, onSelectItem, onViewMore }: CalendarMonthViewProps) {
  const locale = useLocale();
  const t = useTranslations("calendar");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());

  const goToMonth = (next: Date) => {
    setCurrentDate(next);
    const now = new Date();
    const isCurrentMonth =
      next.getFullYear() === now.getFullYear() && next.getMonth() === now.getMonth();
    setSelectedDate(isCurrentMonth ? now : null);
  };

  const prevMonth = () =>
    goToMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () =>
    goToMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const intlLocale = locale === "ar" ? "ar-EG" : "en-US";
  const monthLabel = currentDate.toLocaleDateString(intlLocale, { month: "long", year: "numeric" });

  const selectedItems = selectedDate
    ? items.filter((item) => isSameDay(new Date(item.date), selectedDate))
    : [];

  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-[0_12px_30px_rgba(20,37,74,.18)]">
      <div className={`flex items-center justify-between gap-3 px-4 py-4 ${BAR}`}>
        <button
          type="button"
          onClick={prevMonth}
          className={NAV_BUTTON}
          aria-label={t("previousMonth")}
        >
          <ChevronLeftIcon className="size-5 rtl:rotate-180" />
        </button>
        <div className="flex flex-col items-center gap-1.5">
          <h2 className="font-heading text-lg font-extrabold sm:text-xl">{monthLabel}</h2>
          <button
            type="button"
            onClick={goToday}
            className="rounded-full bg-sidebar-primary px-3 py-0.5 text-[11px] font-extrabold text-sidebar-primary-foreground transition hover:brightness-105"
          >
            {t("today")}
          </button>
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className={NAV_BUTTON}
          aria-label={t("nextMonth")}
        >
          <ChevronRightIcon className="size-5 rtl:rotate-180" />
        </button>
      </div>

      <div className="grid grid-cols-7 bg-[color:var(--action-to,var(--sidebar-accent))] py-3 text-center text-xs font-bold text-[color:var(--action-foreground,var(--sidebar-foreground))] sm:text-sm">
        {WEEKDAYS.map((day) => (
          <div key={day}>{t(`weekdays.${day}`)}</div>
        ))}
      </div>

      <CalendarMonthGrid
        currentDate={currentDate}
        items={items}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <CalendarMonthSelectedPanel
        className={`space-y-3 px-5 py-4 ${BAR}`}
        selectedDate={selectedDate}
        selectedItems={selectedItems}
        onSelectItem={onSelectItem}
        onViewMore={onViewMore}
      />
    </div>
  );
}
