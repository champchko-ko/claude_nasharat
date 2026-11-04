import { validateDateRange } from "@/lib/validation/validateDateRange";
import { isWeekendDay } from "./isWeekendDay";

export function assertValidCalendarInput(
  data: {
    titleAr: string;
    startsAt: string;
    endsAt: string;
  },
  workingDays?: number[] | null,
): string | null {
  if (!data.titleAr || !data.startsAt || !data.endsAt) {
    return "Title, start time, and end time are required";
  }
  if (!validateDateRange(data.startsAt, data.endsAt)) {
    return "End time must be after or equal to start time";
  }
  if (isWeekendDay(data.startsAt, workingDays) || isWeekendDay(data.endsAt, workingDays)) {
    return "Events cannot be scheduled on weekends (Friday or Saturday)";
  }
  return null;
}
