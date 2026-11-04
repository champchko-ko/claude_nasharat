const LOGGED_FLAG = Symbol.for("school-portal.error-logged");

/** True when this error object has already been written to the error log. */
export function isErrorAlreadyLogged(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as Record<symbol, unknown>)[LOGGED_FLAG] === true
  );
}
