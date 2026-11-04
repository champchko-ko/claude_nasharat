import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class ConflictError extends AppError {
  constructor(message = "Conflict with existing resource", correlationId?: string) {
    super(message, {
      code: ERROR_CODES.CONFLICT,
      statusCode: 409,
      isOperational: true,
      correlationId,
    });
    this.name = "ConflictError";
  }
}
