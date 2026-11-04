import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  getClientEnv: vi.fn(() => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://school.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  })),
}));

import { getSchoolLogoUrl } from "./getSchoolLogoUrl";

describe("getSchoolLogoUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when logoPath is null, undefined, or empty", () => {
    expect(getSchoolLogoUrl(null)).toBeNull();
    expect(getSchoolLogoUrl(undefined)).toBeNull();
    expect(getSchoolLogoUrl("")).toBeNull();
  });

  it("constructs correct public asset URL", () => {
    const url = getSchoolLogoUrl("school-1/logo.png");
    expect(url).toBe(
      "https://school.supabase.co/storage/v1/object/public/public-assets/school-1/logo.png",
    );
  });
});
