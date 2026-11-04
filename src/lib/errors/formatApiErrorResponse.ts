import { NextResponse } from "next/server";
import type { AppError } from "./AppError";

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    correlationId?: string;
    details?: Record<string, unknown> | unknown[];
  };
};

export function formatApiErrorResponse(error: AppError): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      correlationId: error.correlationId,
      details: error.details,
    },
  };

  const headers = new Headers();
  if (error.correlationId) {
    headers.set("x-correlation-id", error.correlationId);
  }

  return NextResponse.json(body, {
    status: error.statusCode,
    headers,
  });
}
