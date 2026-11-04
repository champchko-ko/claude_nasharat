import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  getClientEnv: vi.fn(() => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://school.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  })),
}));

import { getPublicDocumentUrl } from "./getPublicDocumentUrl";

describe("getPublicDocumentUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty string when filePath is null or undefined", () => {
    expect(getPublicDocumentUrl(null)).toBe("");
    expect(getPublicDocumentUrl(undefined)).toBe("");
    expect(getPublicDocumentUrl("")).toBe("");
  });

  it("constructs correct public storage URL", () => {
    const url = getPublicDocumentUrl("s1/operational-plan/test.pdf");
    expect(url).toBe(
      "https://school.supabase.co/storage/v1/object/public/school-documents/s1/operational-plan/test.pdf",
    );
  });
});
