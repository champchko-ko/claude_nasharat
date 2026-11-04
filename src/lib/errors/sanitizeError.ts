import { AppError } from "./AppError";
import { createCorrelationId } from "../logger/createCorrelationId";
import { logError, type LogContext } from "../logger/logError";
import { isNextRouterError } from "./isNextRouterError";
import { resolveNormalizedError } from "./resolveNormalizedError";

/**
 * Single server-side normalization point for every caught error.
 *
 * Converts unknown values into an operational AppError, attaches one
 * correlation id, logs the original failure with its diagnostic cause, and
 * rethrows Next's control-flow errors (`redirect()` / `notFound()`). The text
 * returned to users never contains the raw exception message.
 */
export function sanitizeError(
  error: unknown,
  context?: LogContext,
  providedCorrelationId?: string,
): AppError {
  if (isNextRouterError(error)) {
    throw error;
  }

  const existingCorrelationId = error instanceof AppError ? error.correlationId : undefined;
  const correlationId = providedCorrelationId || existingCorrelationId || createCorrelationId();

  const resolved = resolveNormalizedError(error, correlationId);

  // Build the failure log from the original error so the cause/stack survives,
  // but use the normalized correlation id and user-safe code.
  logError(error, context, correlationId);

  return resolved;
}
