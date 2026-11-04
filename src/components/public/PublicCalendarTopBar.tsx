"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface PublicCalendarTopBarProps {
  currentDate: Date;
  locale: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function PublicCalendarTopBar({
  currentDate,
  locale,
  onPrevMonth,
  onNextMonth,
  onToday,
}: PublicCalendarTopBarProps) {
  const intlLocale = locale === "ar" ? "ar-EG" : "en-US";
  const monthName = currentDate.toLocaleDateString(intlLocale, { month: "long" });
  const year = currentDate.getFullYear();
  const todayLabel = locale === "ar" ? "اليوم" : "Today";
  const prevMonthLabel = locale === "ar" ? "الشهر السابق" : "Previous month";
  const nextMonthLabel = locale === "ar" ? "الشهر التالي" : "Next month";

  return (
    <div className="flex items-center justify-between gap-3 bg-[#0c1f44] px-4 py-3.5 text-white sm:px-6">
      <button
        type="button"
        onClick={onToday}
        className="rounded-lg bg-[#e5a93b] px-3.5 py-1.5 text-xs font-black text-[#0c1f44] shadow-xs transition hover:bg-[#d4972b] focus-visible:outline-2 focus-visible:outline-white sm:text-sm"
      >
        {todayLabel}
      </button>

      <div className="flex items-center gap-2 font-heading text-base font-black sm:text-xl">
        <span className="text-[#e5a93b]">{monthName}</span>
        <span className="text-white">{year}</span>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-[#1a2e56] p-1">
        <button
          type="button"
          onClick={locale === "ar" ? onNextMonth : onPrevMonth}
          aria-label={locale === "ar" ? nextMonthLabel : prevMonthLabel}
          className="flex size-7 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronRightIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={locale === "ar" ? onPrevMonth : onNextMonth}
          aria-label={locale === "ar" ? prevMonthLabel : nextMonthLabel}
          className="flex size-7 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}

