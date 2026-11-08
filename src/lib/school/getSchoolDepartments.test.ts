import { beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ from })),
}));

import { getSchoolDepartments } from "./getSchoolDepartments";

function query(result: { data: unknown; error: unknown }) {
  const select = vi.fn(() => ({ order: () => Promise.resolve(result) }));
  from.mockReturnValue({ select });
  return select;
}

describe("getSchoolDepartments", () => {
  beforeEach(() => {
    from.mockReset();
  });

  it("returns every department, even when called without (or with a stale) school id", async () => {
    const select = query({
      data: [{ id: "d1", name_ar: "العلوم", name_en: "Science", is_active: true, created_at: "x" }],
      error: null,
    });

    await expect(getSchoolDepartments()).resolves.toHaveLength(1);
    await expect(getSchoolDepartments("legacy-school")).resolves.toHaveLength(1);
    expect(select).toHaveBeenCalledWith(expect.not.stringContaining("tenant_id"));
  });

  it("returns an empty list when there are none", async () => {
    query({ data: null, error: null });
    await expect(getSchoolDepartments()).resolves.toEqual([]);
  });

  it("throws when the query fails", async () => {
    query({ data: null, error: { message: "boom", code: "XX000" } });
    await expect(getSchoolDepartments()).rejects.toThrow();
  });
});
