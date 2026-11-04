import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class UploadError extends AppError {
  constructor(
    message = "The file could not be uploaded. Please check it and try again.",
    correlationId?: string,
    cause?: unknown,
    statusCode = 422,
  ) {
    super(message, {
      code: ERROR_CODES.UPLOAD_FAILED,
      statusCode,
      isOperational: true,
      correlationId,
      cause,
    });
    this.name = "UploadError";
  }
}
