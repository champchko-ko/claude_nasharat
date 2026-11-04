import type { CalendarRecurrenceFrequency } from "@/lib/calendar/types";

export function parseCalendarRecurrenceInput(formData: FormData) {
  const freqRaw = formData.get("recurrence_freq");
  const recurrenceFreq =
    typeof freqRaw === "string" && freqRaw ? (freqRaw as CalendarRecurrenceFrequency) : "none";

  const untilRaw = formData.get("recurrence_until");
  const recurrenceUntil = typeof untilRaw === "string" && untilRaw.trim() ? untilRaw.trim() : null;

  const countRaw = formData.get("recurrence_count");
  const parsedCount = typeof countRaw === "string" && countRaw ? parseInt(countRaw, 10) : undefined;
  const recurrenceCount = Number.isFinite(parsedCount) ? parsedCount : undefined;

  return { recurrenceFreq, recurrenceUntil, recurrenceCount };
}
