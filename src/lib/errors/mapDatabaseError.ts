import { AppError } from "./AppError";
import { ConflictError } from "./ConflictError";
import { NotFoundError } from "./NotFoundError";
import { ValidationError } from "./ValidationError";
import { ForbiddenError } from "./ForbiddenError";
import { AuthenticationError } from "./AuthenticationError";
import { RateLimitError } from "./RateLimitError";
import { DatabaseError } from "./DatabaseError";
import { TimeoutError } from "./TimeoutError";
import { ServiceUnavailableError } from "./ServiceUnavailableError";
import { UploadError } from "./UploadError";
import { extractDbErrorCode } from "./extractDbErrorCode";
import { getErrorStatus } from "./getErrorStatus";
import { isDatabaseErrorCode } from "./isDatabaseErrorCode";
import { isSafeUserMessage } from "./isSafeUserMessage";

type ErrorFactory = (correlationId?: string, cause?: unknown) => AppError;

const CODE_ERROR_FACTORIES: Record<string, ErrorFactory> = {
  "23505": (corr) => new ConflictError("A record with this identifier already exists", corr),
  "23503": (corr) => new NotFoundError("A referenced record does not exist", corr),
  "23502": (corr) => new ValidationError("A required field is missing", undefined, corr),
  "42501": (corr) => new ForbiddenError("Insufficient permissions to complete operation", corr),
  "22P02": (corr) => new ValidationError("Invalid data format or value", undefined, corr),
  "23514": (corr) => new ValidationError("Data violates validation constraints", undefined, corr),
  "23P01": (corr) => new ConflictError("This record conflicts with an existing record", corr),
  "40001": (corr) => new ConflictError("The record changed concurrently. Please retry.", corr),
  "40P01": (corr) =>
    new ConflictError("The request conflicted with another request. Please retry.", corr),
  "57014": (corr, cause) =>
    new TimeoutError("The database operation timed out. Please try again.", corr, cause),
  "53300": (corr, cause) =>
    new ServiceUnavailableError("The database is busy. Please try again shortly.", corr, cause),
  "53400": (corr, cause) =>
    new ServiceUnavailableError(
      "The database is unavailable. Please try again shortly.",
      corr,
      cause,
    ),
  "57P01": (corr, cause) =>
    new ServiceUnavailableError(
      "The database is restarting. Please try again shortly.",
      corr,
      cause,
    ),
  "08000": (corr, cause) =>
    new ServiceUnavailableError("The database connection failed. Please try again.", corr, cause),
  "08001": (corr, cause) =>
    new ServiceUnavailableError("The database connection failed. Please try again.", corr, cause),
  "08003": (corr, cause) =>
    new ServiceUnavailableError("The database connection failed. Please try again.", corr, cause),
  "08006": (corr, cause) =>
    new ServiceUnavailableError("The database connection failed. Please try again.", corr, cause),
  PGRST116: (corr) => new NotFoundError("Requested record not found", corr),
  PGRST301: (corr) =>
    new AuthenticationError("Your session has expired. Please sign in again.", corr),
  PGRST302: (corr) =>
    new AuthenticationError("Your session has expired. Please sign in again.", corr),
};

const STATUS_ERROR_FACTORIES: Record<number, ErrorFactory> = {
  400: (corr) => new ValidationError("The request could not be processed", undefined, corr),
  401: (corr) => new AuthenticationError("Authentication required", corr),
  403: (corr) => new ForbiddenError("Access denied", corr),
  404: (corr) => new NotFoundError("Resource not found", corr),
  409: (corr) => new ConflictError("Conflict with existing resource", corr),
  413: (corr, cause) => new UploadError("The file is too large", corr, cause, 413),
  422: (corr) => new ValidationError("The submitted data is invalid", undefined, corr),
  429: (corr) => new RateLimitError(undefined, corr),
  500: (corr, cause) => new DatabaseError("A database error occurred", corr, cause),
  502: (corr, cause) =>
    new ServiceUnavailableError(
      "An upstream service returned an error. Please try again.",
      corr,
      cause,
    ),
  503: (corr, cause) =>
    new ServiceUnavailableError(
      "The service is temporarily unavailable. Please try again.",
      corr,
      cause,
    ),
  504: (corr, cause) =>
    new TimeoutError("The upstream service timed out. Please try again.", corr, cause),
};

function isCorrelationId(value: string): boolean {
  return /^(corr|err|cli)_/.test(value) || value.startsWith("NEXT_");
}

export function mapDatabaseError(
  error: unknown,
  fallbackMessageOrCorrelationId?: string,
  providedCorrelationId?: string,
): AppError {
  if (error instanceof AppError) return error;

  let fallbackMessage = "The database operation could not be completed. Please try again.";
  let correlationId = providedCorrelationId;

  if (fallbackMessageOrCorrelationId) {
    if (isCorrelationId(fallbackMessageOrCorrelationId)) {
      correlationId = fallbackMessageOrCorrelationId;
    } else {
      fallbackMessage = isSafeUserMessage(fallbackMessageOrCorrelationId)
        ? fallbackMessageOrCorrelationId
        : fallbackMessage;
    }
  }

  const code = extractDbErrorCode(error);
  if (isDatabaseErrorCode(code) && CODE_ERROR_FACTORIES[code]) {
    return CODE_ERROR_FACTORIES[code](correlationId, error);
  }

  const status = getErrorStatus(error);
  if (status && STATUS_ERROR_FACTORIES[status]) {
    return STATUS_ERROR_FACTORIES[status](correlationId, error);
  }

  return new DatabaseError(fallbackMessage, correlationId, error);
}
