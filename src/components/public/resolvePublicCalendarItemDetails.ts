import type { UnifiedCalendarItem } from "@/lib/calendar/types";
import { getPublicCalendarCategoryStyle } from "./getPublicCalendarCategoryStyle";

export interface ResolvedCalendarItemDetails {
  title: string;
  location: string;
  categoryLabel: string;
  pillClass: string;
}

export function resolvePublicCalendarItemDetails(
  item: UnifiedCalendarItem,
  locale: string,
): ResolvedCalendarItemDetails {
  const isEn = locale === "en";

  if (item.kind === "circular") {
    const style = getPublicCalendarCategoryStyle("bulletin");
    return {
      title: item.circular.title,
      location: item.circular.ref_number || (isEn ? "School Administration" : "الإدارة المدرسية"),
      categoryLabel: isEn ? style.labelEn : style.labelAr,
      pillClass: style.pillClass,
    };
  }

  const ev = item.event;
  const title = isEn && ev.title_en ? ev.title_en : ev.title_ar;
  const location = ev.location || (isEn ? "School Campus" : "مقر المدرسة");
  const style = getPublicCalendarCategoryStyle(ev.category);

  return {
    title,
    location,
    categoryLabel: isEn ? style.labelEn : style.labelAr,
    pillClass: style.pillClass,
  };
}

