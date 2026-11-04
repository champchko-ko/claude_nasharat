import type { CalendarEventRow, UnifiedCalendarItem } from "./types";
import type { CircularRow } from "@/lib/circulars/types";

export function buildUnifiedCalendarItems(
  events: CalendarEventRow[],
  circulars: CircularRow[] = [],
): UnifiedCalendarItem[] {
  const items: UnifiedCalendarItem[] = [];

  for (const ev of events) {
    items.push({
      kind: "event",
      id: ev.id,
      date: ev.starts_at,
      event: ev,
    });
  }

  for (const c of circulars) {
    // Only map published, in_progress, completed, or overdue circulars that have dates
    if (c.status === "draft" || c.status === "cancelled") {
      continue;
    }
    const targetDate = c.due_at || c.publish_at || c.created_at;
    if (targetDate) {
      items.push({
        kind: "circular",
        id: c.id,
        date: targetDate,
        circular: c,
      });
    }
  }

  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
