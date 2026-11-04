const FALLBACK_PATH = "/dashboard";

/**
 * Accepts only a same-origin relative path.
 *
 * `new URL(next, origin)` treats `//evil.example` as a protocol-relative
 * absolute URL, so a `?next=` value taken from the query string was an open
 * redirect. Everything that is not a plain absolute path (no scheme, no host,
 * no backslash, no control characters) falls back to the dashboard.
 */
export function sanitizeNextPath(raw: string | null | undefined): string {
  if (!raw) return FALLBACK_PATH;
  if (!raw.startsWith("/")) return FALLBACK_PATH;
  // Protocol-relative (`//host`) and the browsers' backslash variant (`/\host`).
  if (raw.startsWith("//") || raw.startsWith("/\\")) return FALLBACK_PATH;
  if (raw.includes("\\")) return FALLBACK_PATH;
  // Control characters can be used to smuggle a second header or truncate a URL.
  if (/[\u0000-\u001f\u007f]/.test(raw)) return FALLBACK_PATH;

  return raw;
}
