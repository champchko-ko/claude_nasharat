import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class IntegrationError extends AppError {
  constructor(
    message = "An external service returned an error. Please try again.",
    correlationId?: string,
    cause?: unknown,
  ) {
    super(message, {
      code: ERROR_CODES.INTEGRATION_FAILED,
      statusCode: 502,
      isOperational: true,
      correlationId,
      cause,
    });
    this.name = "IntegrationError";
  }
}
