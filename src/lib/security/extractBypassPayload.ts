import { type NextRequest } from "next/server";

export type BypassPayload = {
  secret: string | null;
  clear: boolean;
};

/**
 * Extracts bypass credentials from search params, headers, or JSON body.
 */
export async function extractBypassPayload(request: NextRequest): Promise<BypassPayload> {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const queryClear = searchParams.has("clear");
  const headerSecret = request.headers.get("x-bypass-secret");

  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const bodySecret = typeof body.secret === "string" ? body.secret : null;
      return {
        secret: bodySecret ?? querySecret ?? headerSecret,
        clear: body.clear === true || queryClear,
      };
    }
  }

  return {
    secret: querySecret ?? headerSecret,
    clear: queryClear,
  };
}
