"use client";

import { useLocale, useTranslations } from "next-intl";
import type { UnifiedCalendarItem } from "@/lib/calendar/types";

export function CalendarMonthSelectedPanel({
  className,
  selectedDate,
  selectedItems,
  onSelectItem,
  onViewMore,
}: {
  className: string;
  selectedDate: Date | null;
  selectedItems: UnifiedCalendarItem[];
  onSelectItem?: (item: UnifiedCalendarItem) => void;
  onViewMore?: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("calendar");
  const intlLocale = locale === "ar" ? "ar-EG" : "en-US";

  return (
    <div className={className}>
      {selectedDate ? (
        <>
          <div className="text-xs font-extrabold text-sidebar-primary">
            {selectedDate.toLocaleDateString(intlLocale, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
          {selectedItems.length === 0 ? (
            <p className="text-sm font-bold">{t("noEventsToday")}</p>
          ) : (
            <ul className="space-y-1.5">
              {selectedItems.slice(0, 4).map((item) => {
                const isEvent = item.kind === "event";
                const title = isEvent
                  ? locale === "ar"
                    ? item.event.title_ar
                    : item.event.title_en || item.event.title_ar
                  : item.circular.title;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectItem?.(item)}
                      className="flex w-full items-center gap-2.5 rounded-md bg-sidebar-foreground/10 px-3 py-2 text-start text-sm font-bold transition-colors hover:bg-sidebar-foreground/20"
                    >
                      <span
                        aria-hidden="true"
                        className={`size-2 shrink-0 rounded-full ${isEvent ? "bg-sidebar-primary" : "bg-chart-4"}`}
                      />
                      <span className="truncate">{title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <p className="text-sm font-bold">{t("selectDay")}</p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onViewMore}
          className="rounded-md bg-sidebar-primary px-4 py-1.5 text-xs font-extrabold text-sidebar-primary-foreground shadow-[0_4px_10px_rgba(0,0,0,.25)] transition hover:-translate-y-0.5 hover:brightness-105"
        >
          {t("viewMore")}
        </button>
      </div>
    </div>
  );
}
