import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { mockReportError } = vi.hoisted(() => ({ mockReportError: vi.fn() }));

vi.mock("@/lib/logger/reportError", () => ({ reportError: mockReportError }));

import { POST } from "./route";

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/client-errors", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/client-errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards a browser crash with its correlation id", async () => {
    const response = await POST(
      post({
        message: "Cannot read properties of undefined",
        correlationId: "cli_abc123",
        url: "http://localhost:3000/en/dashboard",
        stack: "at Dashboard",
        source: "boundary",
      }),
    );

    expect(response.status).toBe(204);
    expect(mockReportError).toHaveBeenCalledTimes(1);
    const [error, context, correlationId] = mockReportError.mock.calls[0];
    expect((error as Error).message).toBe("Cannot read properties of undefined");
    expect(context).toMatchObject({ source: "client", kind: "boundary" });
    expect(correlationId).toBe("cli_abc123");
  });

  it("rejects malformed JSON and unknown shapes", async () => {
    expect((await POST(post("{not json"))).status).toBe(400);
    expect((await POST(post({ message: "" }))).status).toBe(400);
    expect((await POST(post({ message: "x", source: "made-up" }))).status).toBe(400);
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("rejects an oversized body", async () => {
    const response = await POST(post({ message: "x".repeat(9_000) }));
    expect(response.status).toBe(413);
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("rate-limits a flooding client", async () => {
    for (let i = 0; i < 20; i += 1) {
      expect(
        (await POST(post({ message: `crash ${i}` }, { "x-forwarded-for": "198.51.100.9" }))).status,
      ).toBe(204);
    }

    expect(
      (await POST(post({ message: "crash 21" }, { "x-forwarded-for": "198.51.100.9" }))).status,
    ).toBe(429);
    expect(mockReportError).toHaveBeenCalledTimes(20);
  });
});
