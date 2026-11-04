export function validateDateRange(startsAt: string, endsAt: string): boolean {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }
  return end >= start;
}
