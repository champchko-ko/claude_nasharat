import { describe, expect, it, vi } from "vitest";
import { getPlatformOwnerUserIds } from "./getPlatformOwnerUserIds";
import { createSupabaseAdminClient } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

function mockAdmin(eqResult: unknown) {
  const eqMock = vi.fn().mockResolvedValue(eqResult);
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
  const fromMock = vi.fn().mockReturnValue({ select: selectMock });

  vi.mocked(createSupabaseAdminClient).mockReturnValue({
    from: fromMock,
  } as unknown as ReturnType<typeof createSupabaseAdminClient>);

  return { eqMock };
}

describe("getPlatformOwnerUserIds", () => {
  it("returns set of owner user IDs when found", async () => {
    const { eqMock } = mockAdmin({
      data: [{ user_id: "owner-1" }, { user_id: "owner-2" }],
      error: null,
    });

    const res = await getPlatformOwnerUserIds();
    expect(res.size).toBe(2);
    expect(res.has("owner-1")).toBe(true);
    expect(res.has("owner-2")).toBe(true);
    // There is one school, so ownership is simply the `owner` role.
    expect(eqMock).toHaveBeenCalledWith("roles.key", "owner");
  });

  it("returns empty set on error or no data", async () => {
    mockAdmin({ data: null, error: new Error("DB Error") });

    const res = await getPlatformOwnerUserIds();
    expect(res.size).toBe(0);
  });
});
