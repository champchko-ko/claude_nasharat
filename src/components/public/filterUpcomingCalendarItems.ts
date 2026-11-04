import type { UnifiedCalendarItem } from "@/lib/calendar/types";

export interface FilteredUpcomingResult {
  displayItems: UnifiedCalendarItem[];
  isShowingFallback: boolean;
}

export function filterUpcomingCalendarItems(
  items: UnifiedCalendarItem[],
  selectedDate: Date | null,
  limit = 6,
): FilteredUpcomingResult {
  if (!selectedDate) {
    return {
      displayItems: items.slice(0, limit),
      isShowingFallback: false,
    };
  }

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();
  const selectedDay = selectedDate.getDate();

  const matched = items.filter((item) => {
    const d = new Date(item.date);
    return (
      d.getFullYear() === selectedYear &&
      d.getMonth() === selectedMonth &&
      d.getDate() === selectedDay
    );
  });

  if (matched.length > 0) {
    return {
      displayItems: matched.slice(0, limit),
      isShowingFallback: false,
    };
  }

  return {
    displayItems: items.slice(0, limit),
    isShowingFallback: true,
  };
}

