import { describe, it, expect, vi } from "vitest";
import { resolveRequestIp } from "./resolveRequestIp";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

describe("resolveRequestIp", () => {
  it("extracts the first IP from x-forwarded-for header", async () => {
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValueOnce(
      new Headers({ "x-forwarded-for": "203.0.113.195, 70.41.3.18" }),
    );

    const ip = await resolveRequestIp();
    expect(ip).toBe("203.0.113.195");
  });

  it("extracts x-real-ip when x-forwarded-for is missing", async () => {
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValueOnce(new Headers({ "x-real-ip": "198.51.100.4" }));

    const ip = await resolveRequestIp();
    expect(ip).toBe("198.51.100.4");
  });

  it("returns unknown when no IP headers are present", async () => {
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValueOnce(new Headers());

    const ip = await resolveRequestIp();
    expect(ip).toBe("unknown");
  });

  it("returns unknown when headers() throws", async () => {
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockRejectedValueOnce(new Error("Outside request context"));

    const ip = await resolveRequestIp();
    expect(ip).toBe("unknown");
  });
});
