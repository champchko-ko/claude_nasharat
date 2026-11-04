import { sanitizeError } from "./sanitizeError";
import { formatApiErrorResponse } from "./formatApiErrorResponse";

export type ApiRouteHandler<TArgs extends unknown[] = unknown[]> = (
  request: Request,
  ...args: TArgs
) => Promise<Response>;

export function withApiErrorHandler<TArgs extends unknown[] = unknown[]>(
  handler: ApiRouteHandler<TArgs>,
): ApiRouteHandler<TArgs> {
  return async (request: Request, ...args: TArgs): Promise<Response> => {
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const url = new URL(request.url);

    try {
      const response = await handler(request, ...args);
      return response;
    } catch (err: unknown) {
      const sanitized = sanitizeError(
        err,
        {
          path: url.pathname,
          method: request.method,
        },
        correlationId,
      );
      return formatApiErrorResponse(sanitized);
    }
  };
}
