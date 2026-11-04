import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class NetworkError extends AppError {
  constructor(message = "Network service unavailable", correlationId?: string, cause?: unknown) {
    super(message, {
      code: ERROR_CODES.NETWORK_ERROR,
      statusCode: 503,
      isOperational: true,
      correlationId,
      cause,
    });
    this.name = "NetworkError";
  }
}
