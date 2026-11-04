type StatusLike = {
  status?: unknown;
  statusCode?: unknown;
  code?: unknown;
};

/** Extracts an HTTP-like status from Supabase/HTTP error objects. */
export function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  const candidate = error as StatusLike;
  if (typeof candidate.status === "number") return candidate.status;
  if (typeof candidate.statusCode === "number") return candidate.statusCode;

  // Supabase Auth sometimes reports a numeric-looking code as a string.
  if (typeof candidate.code === "string" && /^\d{3}$/.test(candidate.code)) {
    return Number(candidate.code);
  }

  return undefined;
}
