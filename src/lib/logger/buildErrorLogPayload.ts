import { getBuildVersion } from "../health/getBuildVersion";
import { createCorrelationId } from "./createCorrelationId";
import { redactSensitiveData } from "./redactSensitiveData";
import { resolveErrorDetails } from "./resolveErrorDetails";
import { getErrorSeverity } from "./getErrorSeverity";
import { formatLogSnippet } from "./formatLogSnippet";

const MAX_STACK_LENGTH = 8_000;
const MAX_MESSAGE_LENGTH = 2_000;

export function buildErrorLogPayload(
  error: unknown,
  context?: Record<string, unknown>,
  correlationId?: string,
) {
  const details = resolveErrorDetails(error);
  const resolvedCorrelationId = correlationId || details.correlationId || createCorrelationId();
  const requestId =
    typeof context?.requestId === "string" ? context.requestId : resolvedCorrelationId;

  return {
    timestamp: new Date().toISOString(),
    severity: getErrorSeverity(details.statusCode),
    level: details.statusCode >= 500 ? "ERROR" : "WARN",
    environment: process.env.NODE_ENV ?? "unknown",
    release: getBuildVersion(),
    correlationId: resolvedCorrelationId,
    requestId,
    code: details.code,
    statusCode: details.statusCode,
    message: formatLogSnippet(details.rawMessage, MAX_MESSAGE_LENGTH) ?? "",
    context: context ? redactSensitiveData(context) : undefined,
    cause: formatLogSnippet(details.causeMessage, MAX_MESSAGE_LENGTH),
    stack: formatLogSnippet(details.rawStack, MAX_STACK_LENGTH),
    causeStack: formatLogSnippet(details.causeStack, MAX_STACK_LENGTH),
  };
}
