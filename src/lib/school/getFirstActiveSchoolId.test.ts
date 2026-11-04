import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFirstActiveSchoolId } from "./getFirstActiveSchoolId";

const { mockServerSelect, mockAdminSelect } = vi.hoisted(() => ({
  mockServerSelect: vi.fn(),
  mockAdminSelect: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      from: () => ({
        select: mockServerSelect,
      }),
    }),
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: mockAdminSelect,
    }),
  }),
}));

describe("getFirstActiveSchoolId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns school id from session client when available", async () => {
    mockServerSelect.mockReturnValue({
      eq: () => ({
        order: () => ({
          limit: () => ({
            maybeSingle: () => Promise.resolve({ data: { id: "school-1" }, error: null }),
          }),
        }),
      }),
    });

    const res = await getFirstActiveSchoolId();
    expect(res).toBe("school-1");
  });

  it("falls back to admin client when session client fails or returns null", async () => {
    mockServerSelect.mockReturnValue({
      eq: () => ({
        order: () => ({
          limit: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: { message: "error" } }),
          }),
        }),
      }),
    });

    mockAdminSelect.mockReturnValue({
      eq: () => ({
        order: () => ({
          limit: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: { id: "school-admin-fallback" }, error: null }),
          }),
        }),
      }),
    });

    const res = await getFirstActiveSchoolId();
    expect(res).toBe("school-admin-fallback");
  });
});
