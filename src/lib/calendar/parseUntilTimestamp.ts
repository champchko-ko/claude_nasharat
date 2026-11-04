export function parseUntilTimestamp(untilDate?: string | null): number | null {
  if (!untilDate) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(untilDate)) {
    const [year, month, day] = untilDate.split("-").map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
  }
  const parsed = new Date(untilDate).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}
