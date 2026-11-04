import type { Instrumentation } from "next";
import { reportError } from "@/lib/logger/reportError";

/**
 * Last-resort server error reporting.
 *
 * Next calls this for errors raised while rendering a server component, running
 * a route handler, executing a Server Action or the proxy. Errors that a caller
 * already handled (and turned into a result) never reach it, so this is the
 * signal for real breakage — the previous behaviour was a bare console dump
 * with no correlation id and no way to alert on it.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest?: unknown }).digest)
      : undefined;

  await reportError(
    error,
    {
      source: "instrumentation.onRequestError",
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      digest,
    },
    digest,
  );
};
