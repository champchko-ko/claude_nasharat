import { describe, it, expect } from "vitest";
import { withApiErrorHandler } from "./withApiErrorHandler";
import { ForbiddenError } from "./ForbiddenError";
import { ERROR_CODES } from "./errorCodes";

describe("withApiErrorHandler", () => {
  it("returns normal response when handler succeeds", async () => {
    const handler = withApiErrorHandler(async () => {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const req = new Request("http://localhost:3000/api/test");
    const res = await handler(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("catches AppError and formats structured response with status code", async () => {
    const handler = withApiErrorHandler(async () => {
      throw new ForbiddenError("Not allowed to access resource");
    });

    const req = new Request("http://localhost:3000/api/test", {
      headers: { "x-correlation-id": "custom-corr-id" },
    });
    const res = await handler(req);

    expect(res.status).toBe(403);
    expect(res.headers.get("x-correlation-id")).toBe("custom-corr-id");

    const body = (await res.json()) as {
      success: boolean;
      error: { code: string; message: string; correlationId: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    expect(body.error.correlationId).toBe("custom-corr-id");
  });

  it("catches unexpected exceptions and returns 500 without leaking stack", async () => {
    const handler = withApiErrorHandler(async () => {
      throw new Error("Fatal DB connection timeout at postgresql://user:pass@internal:5432");
    });

    const req = new Request("http://localhost:3000/api/test");
    const res = await handler(req);

    expect(res.status).toBe(500);
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string; correlationId: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(body.error.correlationId).toBeDefined();
  });
});
