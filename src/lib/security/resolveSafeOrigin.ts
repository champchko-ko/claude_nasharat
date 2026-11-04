/**
 * Safely extracts the protocol + host origin from a URL string.
 * Returns null if the URL is undefined, empty, or invalid.
 */
export function resolveSafeOrigin(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
