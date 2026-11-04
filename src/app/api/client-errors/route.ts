import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiErrorHandler } from "@/lib/errors";
import { reportError } from "@/lib/logger/reportError";
import { consumeRateLimitToken } from "@/lib/rateLimit/consumeRateLimitToken";

// A browser error payload is small; a request larger than this is not one.
const MAX_BODY_BYTES = 8_192;
const RATE_LIMIT_PER_MINUTE = 20;

const clientErrorSchema = z.object({
  message: z.string().min(1).max(2_000),
  correlationId: z.string().min(1).max(100).optional(),
  url: z.string().max(2_000).optional(),
  stack: z.string().max(6_000).optional(),
  source: z.enum(["boundary", "error", "unhandledrejection"]).optional(),
});

/** First hop of the proxy chain, or a stable placeholder when absent. */
function resolveClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}

/**
 * Receives browser-side crashes that the error boundaries saw.
 *
 * The response never echoes anything about the payload: this endpoint is public
 * by nature, so it must not become an oracle. Success is always 204.
 */
async function handleClientError(request: Request) {
  if (
    !consumeRateLimitToken(
      `client-error:${resolveClientKey(request)}`,
      RATE_LIMIT_PER_MINUTE,
      60_000,
    )
  ) {
    return new NextResponse(null, { status: 429 });
  }

  const raw = await request.text();
  if (!raw || raw.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const parsed = clientErrorSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(null, { status: 400 });
  }

  const { message, correlationId, url, stack, source } = parsed.data;

  await reportError(
    new Error(message),
    { source: "client", kind: source, pageUrl: url, clientStack: stack },
    correlationId,
  );

  return new NextResponse(null, { status: 204 });
}

export const POST = withApiErrorHandler(handleClientError);
