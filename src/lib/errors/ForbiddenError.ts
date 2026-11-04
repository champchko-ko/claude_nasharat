import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class ForbiddenError extends AppError {
  constructor(message = "Access denied", correlationId?: string) {
    super(message, {
      code: ERROR_CODES.FORBIDDEN,
      statusCode: 403,
      isOperational: true,
      correlationId,
    });
    this.name = "ForbiddenError";
  }
}
