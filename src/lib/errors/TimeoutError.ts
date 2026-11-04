import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class TimeoutError extends AppError {
  constructor(
    message = "The operation timed out. Please try again.",
    correlationId?: string,
    cause?: unknown,
  ) {
    super(message, {
      code: ERROR_CODES.TIMEOUT,
      statusCode: 504,
      isOperational: true,
      correlationId,
      cause,
    });
    this.name = "TimeoutError";
  }
}
