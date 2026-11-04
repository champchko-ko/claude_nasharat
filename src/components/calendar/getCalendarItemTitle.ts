import type { UnifiedCalendarItem } from "@/lib/calendar/types";

export function getCalendarItemTitle(item: UnifiedCalendarItem, locale: string): string {
  if (item.kind === "circular") {
    return item.circular.title;
  }
  if (locale === "ar") {
    return item.event.title_ar;
  }
  return item.event.title_en || item.event.title_ar;
}
