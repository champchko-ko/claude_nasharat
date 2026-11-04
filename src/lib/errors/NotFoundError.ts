import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", correlationId?: string) {
    super(message, {
      code: ERROR_CODES.NOT_FOUND,
      statusCode: 404,
      isOperational: true,
      correlationId,
    });
    this.name = "NotFoundError";
  }
}
