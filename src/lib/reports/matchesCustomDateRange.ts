export function matchesCustomDateRange(
  timestamp: string | null | undefined,
  fromDate: string,
  toDate: string,
): boolean {
  if (!fromDate && !toDate) return true;
  if (!timestamp) return false;
  const dateStr = timestamp.slice(0, 10);
  if (fromDate && dateStr < fromDate) return false;
  if (toDate && dateStr > toDate) return false;
  return true;
}
