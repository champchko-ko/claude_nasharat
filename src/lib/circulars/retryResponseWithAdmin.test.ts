import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockEqThird = vi.fn();
const mockEqSecond = vi.fn().mockReturnValue({ eq: mockEqThird });
const mockEqFirst = vi.fn().mockReturnValue({ eq: mockEqSecond });

mockUpdate.mockReturnValue({ eq: mockEqFirst });

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "circular_responses") {
        return {
          update: mockUpdate,
          insert: mockInsert,
        };
      }
      return {};
    }),
  }),
}));

import { retryResponseWithAdmin } from "./retryResponseWithAdmin";

describe("retryResponseWithAdmin", () => {
  it("demotes previous latest response and inserts new response successfully", async () => {
    mockInsert.mockResolvedValue({ error: null });

    await expect(
      retryResponseWithAdmin({
        circularId: "circ-1",
        schoolId: "school-1",
        departmentId: "dept-1",
        responderId: "user-1",
        responseType: "task",
        status: "completed",
        reason: null,
      }),
    ).resolves.toBeUndefined();

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ is_latest: false }));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        circular_id: "circ-1",
        status: "completed",
        is_latest: true,
      }),
    );
  });

  it("throws mapped database error when admin insert fails", async () => {
    mockInsert.mockResolvedValue({
      error: { code: "42501", message: "Permission denied" },
    });

    await expect(
      retryResponseWithAdmin({
        circularId: "circ-1",
        schoolId: "school-1",
        departmentId: "dept-1",
        responderId: "user-1",
        responseType: "task",
        status: "completed",
      }),
    ).rejects.toThrow("Insufficient permissions to complete operation");
  });
});
