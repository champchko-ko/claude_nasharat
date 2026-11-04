const DEDUPE_WINDOW_MS = 5_000;
const MAX_TRACKED_REPORTS = 50;

const recentReports = new Map<string, number>();

/**
 * True when the same failure was already reported moments ago.
 *
 * One crash can reach both a window listener and an error boundary; sending it
 * twice would double the noise for no extra information. Bounded so the map
 * cannot grow for the life of the tab.
 */
export function isDuplicateClientError(key: string): boolean {
  const now = Date.now();
  const seen = recentReports.get(key);

  if (seen !== undefined && now - seen < DEDUPE_WINDOW_MS) return true;

  if (recentReports.size >= MAX_TRACKED_REPORTS) recentReports.clear();
  recentReports.set(key, now);
  return false;
}
