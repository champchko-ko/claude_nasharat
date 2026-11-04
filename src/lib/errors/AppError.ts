import { ERROR_CODES, type ErrorCode } from "./errorCodes";

export type AppErrorOptions = {
  code?: ErrorCode;
  statusCode?: number;
  isOperational?: boolean;
  correlationId?: string;
  details?: Record<string, unknown> | unknown[];
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly correlationId?: string;
  readonly details?: Record<string, unknown> | unknown[];

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.code = options.code ?? ERROR_CODES.INTERNAL_ERROR;
    this.statusCode = options.statusCode ?? 500;
    this.isOperational = options.isOperational ?? true;
    this.correlationId = options.correlationId;
    this.details = options.details;

    if (options.cause) {
      this.cause = options.cause;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
