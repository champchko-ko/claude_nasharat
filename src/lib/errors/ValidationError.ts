import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class ValidationError extends AppError {
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message = "Validation failed",
    fieldErrors?: Record<string, string[]>,
    correlationId?: string,
  ) {
    super(message, {
      code: ERROR_CODES.VALIDATION_FAILED,
      statusCode: 422,
      isOperational: true,
      correlationId,
      details: fieldErrors,
    });
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}
