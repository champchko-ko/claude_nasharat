import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class RateLimitError extends AppError {
  constructor(message = "Too many requests, please try again later", correlationId?: string) {
    super(message, {
      code: ERROR_CODES.RATE_LIMITED,
      statusCode: 429,
      isOperational: true,
      correlationId,
    });
    this.name = "RateLimitError";
  }
}
