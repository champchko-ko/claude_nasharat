/** True for Supabase Auth errors, which carry their own status/name shape. */
export function isAuthError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    ((error as { __isAuthError?: unknown }).__isAuthError === true ||
      (error as { name?: unknown }).name === "AuthError")
  );
}
