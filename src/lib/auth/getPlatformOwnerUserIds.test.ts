import { describe, expect, it, vi } from "vitest";
import { getPlatformOwnerUserIds } from "./getPlatformOwnerUserIds";
import { createSupabaseAdminClient } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

function mockAdmin(isResult: unknown) {
  const isMock = vi.fn().mockResolvedValue(isResult);
  const eqMock = vi.fn().mockReturnValue({ is: isMock });
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
  const fromMock = vi.fn().mockReturnValue({ select: selectMock });

  vi.mocked(createSupabaseAdminClient).mockReturnValue({
    from: fromMock,
  } as unknown as ReturnType<typeof createSupabaseAdminClient>);

  return { isMock };
}

describe("getPlatformOwnerUserIds", () => {
  it("returns set of owner user IDs when found", async () => {
    const { isMock } = mockAdmin({
      data: [{ user_id: "owner-1" }, { user_id: "owner-2" }],
      error: null,
    });

    const res = await getPlatformOwnerUserIds();
    expect(res.size).toBe(2);
    expect(res.has("owner-1")).toBe(true);
    expect(res.has("owner-2")).toBe(true);
    // Platform ownership is a GLOBAL assignment; a school-scoped role keyed
    // "owner" must never count (audit finding B-1).
    expect(isMock).toHaveBeenCalledWith("school_id", null);
  });

  it("returns empty set on error or no data", async () => {
    mockAdmin({ data: null, error: new Error("DB Error") });

    const res = await getPlatformOwnerUserIds();
    expect(res.size).toBe(0);
  });
});
