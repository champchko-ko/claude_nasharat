import type { CalendarRecurrenceFrequency } from "./types";
import { parseUntilTimestamp } from "./parseUntilTimestamp";

export function resolveRecurrenceLimits(params: {
  frequency?: CalendarRecurrenceFrequency;
  untilDate?: string | null;
  maxCount?: number;
}): { freq: CalendarRecurrenceFrequency; untilTimestamp: number; countLimit: number } {
  const freq = params.frequency ?? "none";
  const parsedUntil = parseUntilTimestamp(params.untilDate);
  const untilTimestamp = parsedUntil ?? Number.POSITIVE_INFINITY;
  const countLimit = Math.min(Math.max(params.maxCount ?? 52, 1), 100);

  return { freq, untilTimestamp, countLimit };
}
