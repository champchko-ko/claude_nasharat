import type { CalendarRecurrenceFrequency } from "./types";

export function advanceRecurrenceDate(current: Date, freq: CalendarRecurrenceFrequency): Date {
  const next = new Date(current);
  if (freq === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (freq === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (freq === "biweekly") {
    next.setDate(next.getDate() + 14);
  } else if (freq === "monthly") {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}
