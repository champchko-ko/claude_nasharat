import { NextResponse, type NextRequest } from "next/server";
import { constantTimeCompare } from "./constantTimeCompare";
import { createBypassToken } from "./createBypassToken";
import { extractBypassPayload } from "./extractBypassPayload";

const COOKIE_NAME = "bypass_construction";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Validates under-construction bypass requests and sets or clears signed cookie tokens.
 */
export async function handleBypassRequest(request: NextRequest): Promise<NextResponse> {
  const { secret, clear } = await extractBypassPayload(request);
  const expectedSecret = process.env.UNDER_CONSTRUCTION_BYPASS_SECRET;

  if (clear) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  if (!expectedSecret || !secret || !constantTimeCompare(secret, expectedSecret)) {
    return NextResponse.json({ error: "Invalid or unconfigured bypass secret" }, { status: 401 });
  }

  const token = createBypassToken(expectedSecret);
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return response;
}
