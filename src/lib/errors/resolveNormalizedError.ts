import { AppError } from "./AppError";
import { TimeoutError } from "./TimeoutError";
import { ServiceUnavailableError } from "./ServiceUnavailableError";
import { ERROR_CODES } from "./errorCodes";
import { formatZodError } from "../validation/formatZodError";
import { attachErrorCorrelation } from "./attachErrorCorrelation";
import { isAuthError } from "./isAuthError";
import { isDatabaseErrorCode } from "./isDatabaseErrorCode";
import { extractDbErrorCode } from "./extractDbErrorCode";
import { isNetworkError } from "./isNetworkError";
import { isTimeoutError } from "./isTimeoutError";
import { isZodError } from "./isZodError";
import { mapAuthError } from "./mapAuthError";
import { mapDatabaseError } from "./mapDatabaseError";
import { mapHttpStatusError } from "./mapHttpStatusError";
import { getErrorStatus } from "./getErrorStatus";

const SAFE_UNEXPECTED_MESSAGE = "An unexpected error occurred. Please try again later.";

export function resolveNormalizedError(error: unknown, correlationId: string): AppError {
  if (error instanceof AppError) {
    return attachErrorCorrelation(error, correlationId);
  }
  if (isZodError(error)) {
    return attachErrorCorrelation(formatZodError(error), correlationId);
  }
  if (isAuthError(error)) {
    return mapAuthError(error, correlationId);
  }
  if (isTimeoutError(error)) {
    return new TimeoutError(undefined, correlationId, error);
  }
  if (isNetworkError(error)) {
    return new ServiceUnavailableError(undefined, correlationId, error);
  }
  if (isDatabaseErrorCode(extractDbErrorCode(error))) {
    return mapDatabaseError(error, undefined, correlationId);
  }

  const status = getErrorStatus(error);
  const byStatus = status ? mapHttpStatusError(status, correlationId, error) : undefined;
  return (
    byStatus ??
    new AppError(SAFE_UNEXPECTED_MESSAGE, {
      code: ERROR_CODES.INTERNAL_ERROR,
      statusCode: 500,
      isOperational: false,
      correlationId,
      cause: error,
    })
  );
}
