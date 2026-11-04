import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { reportError } from "./reportError";

describe("reportError", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.ERROR_REPORTING_URL;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns the correlation id it logged", async () => {
    const result = await reportError(new Error("boom"), { path: "/x" }, "err_known");
    expect(result.correlationId).toBe("err_known");
  });

  it("generates a correlation id when none is supplied", async () => {
    const result = await reportError(new Error("boom"));
    expect(result.correlationId).toMatch(/^err_/);
  });

  it("does not call the network when no sink is configured", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await reportError(new Error("boom"));

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forwards the structured payload to the configured sink", async () => {
    vi.stubEnv("ERROR_REPORTING_URL", "https://errors.example/ingest");
    vi.stubEnv("ERROR_REPORTING_TOKEN", "token-123");
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchSpy);

    await reportError(new Error("boom"), { path: "/x" }, "err_forward");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://errors.example/ingest");
    expect((init as RequestInit).headers).toMatchObject({ authorization: "Bearer token-123" });
    expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
      correlationId: "err_forward",
      message: "boom",
    });
  });

  it("swallows a sink failure", async () => {
    vi.stubEnv("ERROR_REPORTING_URL", "https://errors.example/ingest");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(reportError(new Error("boom"))).resolves.toMatchObject({
      correlationId: expect.stringMatching(/^err_/),
    });
  });
});
