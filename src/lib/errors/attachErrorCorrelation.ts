import type { AppError } from "./AppError";

/** Attaches a correlation id once; an id already on the error is preserved. */
export function attachErrorCorrelation<T extends AppError>(error: T, correlationId: string): T {
  if (!error.correlationId) {
    (error as { correlationId?: string }).correlationId = correlationId;
  }
  return error;
}
