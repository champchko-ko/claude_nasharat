import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required", correlationId?: string) {
    super(message, {
      code: ERROR_CODES.UNAUTHORIZED,
      statusCode: 401,
      isOperational: true,
      correlationId,
    });
    this.name = "AuthenticationError";
  }
}
