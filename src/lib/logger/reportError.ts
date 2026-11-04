import { buildErrorLogPayload } from "./buildErrorLogPayload";
import { createCorrelationId } from "./createCorrelationId";
import { isErrorAlreadyLogged } from "./isErrorAlreadyLogged";
import { markErrorLogged } from "./markErrorLogged";
import { reportErrorToSink } from "./reportErrorToSink";

/**
 * Reports an error that nothing else handled.
 *
 * Written into the structured log with a correlation id that is also returned
 * to the caller (and shown to the user as a reference code), then forwarded to
 * `ERROR_REPORTING_URL` when a collector is configured. `logError` is the path
 * for errors a caller already handles; this one is for the last resort.
 */
export async function reportError(
  error: unknown,
  context?: Record<string, unknown>,
  providedCorrelationId?: string,
): Promise<{ correlationId: string }> {
  const correlationId = providedCorrelationId || createCorrelationId();
  const payload = buildErrorLogPayload(error, context, correlationId);

  if (isErrorAlreadyLogged(error)) {
    return { correlationId: payload.correlationId };
  }

  markErrorLogged(error);

  if (process.env.NODE_ENV !== "test") {
    console.error(JSON.stringify(payload));
  }

  await reportErrorToSink(payload);

  return { correlationId: payload.correlationId };
}
