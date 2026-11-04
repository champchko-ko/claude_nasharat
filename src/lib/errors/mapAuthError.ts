import type { AppError } from "./AppError";
import { AuthenticationError } from "./AuthenticationError";
import { ForbiddenError } from "./ForbiddenError";
import { RateLimitError } from "./RateLimitError";
import { ServiceUnavailableError } from "./ServiceUnavailableError";
import { getErrorStatus } from "./getErrorStatus";

/** Maps a Supabase Auth failure without leaking credential details. */
export function mapAuthError(error: unknown, correlationId: string): AppError {
  const status = getErrorStatus(error);
  if (status === 403) return new ForbiddenError("Access denied", correlationId);
  if (status === 429) return new RateLimitError(undefined, correlationId);
  if (status && status >= 500) {
    return new ServiceUnavailableError(undefined, correlationId, error);
  }
  return new AuthenticationError("Invalid credentials or expired session", correlationId);
}
