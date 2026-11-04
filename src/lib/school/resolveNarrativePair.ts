/**
 * Resolves localized narrative fallback (e.g. vision/mission).
 */
export function resolveNarrativePair(
  localized?: string | null,
  legacy?: string | null,
): string | null {
  return localized || legacy || null;
}
