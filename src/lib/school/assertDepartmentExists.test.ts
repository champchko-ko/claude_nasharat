import { beforeEach, describe, expect, it, vi } from "vitest";

const { maybeSingle } = vi.hoisted(() => ({ maybeSingle: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  })),
}));

import { ValidationError } from "@/lib/errors/ValidationError";
import { assertDepartmentExists } from "./assertDepartmentExists";

describe("assertDepartmentExists", () => {
  beforeEach(() => {
    maybeSingle.mockReset();
  });

  it("does nothing when no department is given", async () => {
    await expect(assertDepartmentExists(null)).resolves.toBeUndefined();
    await expect(assertDepartmentExists("")).resolves.toBeUndefined();
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("accepts an existing department", async () => {
    maybeSingle.mockResolvedValue({ data: { id: "d1" }, error: null });
    await expect(assertDepartmentExists("d1")).resolves.toBeUndefined();
  });

  it("rejects an unknown department", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(assertDepartmentExists("missing")).rejects.toThrow(ValidationError);
  });

  it("surfaces database errors instead of calling the department invalid", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: "boom", code: "XX000" } });
    await expect(assertDepartmentExists("d1")).rejects.toThrow();
  });
});
