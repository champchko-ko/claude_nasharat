import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { pingSupabaseDatabase } from "./pingSupabaseDatabase";

const mockSelect = vi.fn();
const mockLimit = vi.fn();
const mockFrom = vi.fn();

vi.mock("./createSupabaseAdminClient", () => ({
  createSupabaseAdminClient: () => ({
    from: mockFrom,
  }),
}));

describe("pingSupabaseDatabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ limit: mockLimit });
  });

  it("returns success and latency on successful query", async () => {
    mockLimit.mockResolvedValue({ data: [{ id: "school-1" }], error: null });

    const result = await pingSupabaseDatabase();

    expect(result.success).toBe(true);
    expect(typeof result.latencyMs).toBe("number");
    expect(typeof result.timestamp).toBe("string");
    expect(mockFrom).toHaveBeenCalledWith("schools");
    expect(mockSelect).toHaveBeenCalledWith("id");
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it("throws error when database query fails", async () => {
    const dbError = new Error("Database connection failed");
    mockLimit.mockResolvedValue({ data: null, error: dbError });

    await expect(pingSupabaseDatabase()).rejects.toThrow("Database connection failed");
  });
});
