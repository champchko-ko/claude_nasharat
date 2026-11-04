import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class DatabaseError extends AppError {
  constructor(message = "A database error occurred", correlationId?: string, cause?: unknown) {
    super(message, {
      code: ERROR_CODES.DATABASE_ERROR,
      statusCode: 500,
      isOperational: true,
      correlationId,
      cause,
    });
    this.name = "DatabaseError";
  }
}
