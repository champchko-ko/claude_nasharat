import { afterEach, describe, expect, it, vi } from "vitest";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_URL",
  "SCHOOL_TIMEZONE",
] as const;

function clearEnv() {
  for (const key of KEYS) delete process.env[key];
}

describe("getServerEnv", () => {
  afterEach(() => {
    clearEnv();
    vi.resetModules();
  });

  it("parses a valid environment", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.APP_URL = "http://localhost:3000";
    process.env.SCHOOL_TIMEZONE = "UTC";
    vi.resetModules();
    const { getServerEnv } = await import("./getServerEnv");
    expect(getServerEnv().SCHOOL_TIMEZONE).toBe("UTC");
  });

  it("throws and names the missing keys", async () => {
    vi.resetModules();
    const { getServerEnv } = await import("./getServerEnv");
    expect(() => getServerEnv()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
