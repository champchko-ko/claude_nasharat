import { buildErrorLogPayload } from "./buildErrorLogPayload";
import { isErrorAlreadyLogged } from "./isErrorAlreadyLogged";
import { markErrorLogged } from "./markErrorLogged";
import { reportErrorToSink } from "./reportErrorToSink";

export type LogContext = Record<string, unknown>;

/**
 * Central structured error log.
 *
 * Writes one JSON line, forwards the same payload to the configured collector,
 * and marks the error object so a second handler for the same failure does not
 * create a duplicate line with a different reference code. The sink call is
 * fire-and-forget: a collector outage must not fail the request that produced
 * the error.
 */
export function logError(
  error: unknown,
  context?: LogContext,
  correlationId?: string,
): { correlationId: string } {
  const payload = buildErrorLogPayload(error, context, correlationId);

  if (isErrorAlreadyLogged(error)) {
    return { correlationId: payload.correlationId };
  }

  markErrorLogged(error);

  if (process.env.NODE_ENV !== "test") {
    console.error(JSON.stringify(payload));
  }

  void reportErrorToSink(payload);

  return { correlationId: payload.correlationId };
}
