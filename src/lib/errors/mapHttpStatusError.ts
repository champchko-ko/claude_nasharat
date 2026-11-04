import type { AppError } from "./AppError";
import { AuthenticationError } from "./AuthenticationError";
import { ConflictError } from "./ConflictError";
import { ForbiddenError } from "./ForbiddenError";
import { IntegrationError } from "./IntegrationError";
import { NotFoundError } from "./NotFoundError";
import { RateLimitError } from "./RateLimitError";
import { ServiceUnavailableError } from "./ServiceUnavailableError";
import { TimeoutError } from "./TimeoutError";
import { UploadError } from "./UploadError";
import { ValidationError } from "./ValidationError";

type ErrorFactory = (correlationId?: string, cause?: unknown) => AppError;

const STATUS_FACTORIES: Record<number, ErrorFactory> = {
  400: (corr) => new ValidationError("The submitted data is invalid", undefined, corr),
  401: (corr) => new AuthenticationError("Authentication required", corr),
  403: (corr) => new ForbiddenError("Access denied", corr),
  404: (corr) => new NotFoundError("Resource not found", corr),
  409: (corr) => new ConflictError("Conflict with existing resource", corr),
  413: (corr, cause) => new UploadError("The file is too large", corr, cause, 413),
  422: (corr) => new ValidationError("The submitted data is invalid", undefined, corr),
  429: (corr) => new RateLimitError(undefined, corr),
  502: (corr, cause) => new IntegrationError(undefined, corr, cause),
  503: (corr, cause) => new ServiceUnavailableError(undefined, corr, cause),
  504: (corr, cause) => new TimeoutError(undefined, corr, cause),
};

export function mapHttpStatusError(
  status: number,
  correlationId?: string,
  cause?: unknown,
): AppError | undefined {
  const factory = STATUS_FACTORIES[status];
  if (factory) {
    return factory(correlationId, cause);
  }

  return status >= 500 ? new ServiceUnavailableError(undefined, correlationId, cause) : undefined;
}
