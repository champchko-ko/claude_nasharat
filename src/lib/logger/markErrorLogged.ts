const LOGGED_FLAG = Symbol.for("school-portal.error-logged");

function markOne(error: unknown): void {
  if (typeof error !== "object" || error === null) return;
  try {
    (error as Record<symbol, unknown>)[LOGGED_FLAG] = true;
  } catch {
    // Frozen error objects cannot be marked; the caller still logs them.
  }
}

/**
 * Marks an error, and its cause chain, as logged.
 *
 * `sanitizeError` may see the same failure twice (for example when an inner
 * audit step sanitizes it and the outer action handler catches the rethrow).
 * Marking the cause chain prevents a second log line with a second reference
 * code for one failure.
 */
export function markErrorLogged(error: unknown, depth = 0): void {
  if (depth > 3) return;
  markOne(error);

  if (typeof error === "object" && error !== null && "cause" in error) {
    markErrorLogged((error as { cause?: unknown }).cause, depth + 1);
  }
}
