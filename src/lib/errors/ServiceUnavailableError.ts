import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class ServiceUnavailableError extends AppError {
  constructor(
    message = "The service is temporarily unavailable. Please try again.",
    correlationId?: string,
    cause?: unknown,
  ) {
    super(message, {
      code: ERROR_CODES.SERVICE_UNAVAILABLE,
      statusCode: 503,
      isOperational: true,
      correlationId,
      cause,
    });
    this.name = "ServiceUnavailableError";
  }
}
