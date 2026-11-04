import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class TransactionError extends AppError {
  constructor(
    message = "The operation could not be completed. No partial changes were kept.",
    correlationId?: string,
    cause?: unknown,
  ) {
    super(message, {
      code: ERROR_CODES.TRANSACTION_FAILED,
      statusCode: 500,
      isOperational: true,
      correlationId,
      cause,
    });
    this.name = "TransactionError";
  }
}
