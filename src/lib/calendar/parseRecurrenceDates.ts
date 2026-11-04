export function parseRecurrenceDates(
  startsAt: string,
  endsAt: string,
): { start: Date; end: Date; durationMs: number } | null {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end.getTime() < start.getTime()
  ) {
    return null;
  }
  return { start, end, durationMs: end.getTime() - start.getTime() };
}
