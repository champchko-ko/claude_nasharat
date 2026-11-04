import { isAppError } from "../errors/isAppError";

export type ErrorDetails = {
  code: string;
  statusCode: number;
  rawMessage: string;
  rawStack?: string;
  correlationId?: string;
  causeMessage?: string;
  causeStack?: string;
};

function readCause(error: unknown): { message?: string; stack?: string } {
  if (typeof error !== "object" || error === null || !("cause" in error)) return {};
  const cause = (error as { cause?: unknown }).cause;
  if (cause instanceof Error) return { message: cause.message, stack: cause.stack };
  if (typeof cause === "string") return { message: cause };
  return {};
}

/**
 * Extracts normalized error details including status code, code string,
 * raw message, stack trace, and correlation ID. The cause chain is included
 * because the typed AppError message is user-safe while the cause holds the
 * diagnostic detail operators need.
 */
export function resolveErrorDetails(error: unknown): ErrorDetails {
  const isApp = isAppError(error);
  const isErr = error instanceof Error;
  const cause = readCause(error);

  return {
    code: isApp ? error.code : "INTERNAL_ERROR",
    statusCode: isApp ? error.statusCode : 500,
    rawMessage: isErr ? error.message : String(error),
    rawStack: isErr ? error.stack : undefined,
    correlationId: isApp ? error.correlationId : undefined,
    causeMessage: cause.message,
    causeStack: cause.stack,
  };
}
