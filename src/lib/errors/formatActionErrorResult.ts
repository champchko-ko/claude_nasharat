import type { AppError } from "./AppError";
import { ValidationError } from "./ValidationError";

export type ActionErrorResult = {
  success: false;
  error: string;
  code: string;
  correlationId?: string;
  fieldErrors?: Record<string, string[]>;
};

export type ActionSuccessResult<T = Record<string, unknown>> = {
  success: true;
  error?: undefined;
} & T;

export type ActionResult<T = Record<string, unknown>> = ActionSuccessResult<T> | ActionErrorResult;

export function formatActionErrorResult(error: AppError): ActionErrorResult {
  const fieldErrors = error instanceof ValidationError ? error.fieldErrors : undefined;

  return {
    success: false,
    error: error.message,
    code: error.code,
    correlationId: error.correlationId,
    fieldErrors,
  };
}
