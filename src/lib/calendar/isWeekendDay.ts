export function isWeekendDay(
  input: string | Date | null | undefined,
  workingDays?: number[] | null,
): boolean {
  if (!input) return false;
  const target = typeof input === "string" && input.length === 10 ? `${input}T12:00:00` : input;
  const date = target instanceof Date ? target : new Date(target);
  const day = date.getDay();
  if (Array.isArray(workingDays) && workingDays.length > 0) {
    return !workingDays.includes(day);
  }
  return day === 5 || day === 6;
}
