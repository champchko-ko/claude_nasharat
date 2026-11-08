import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/rbac/hasPermission", () => ({
  hasPermission: vi.fn(),
}));

import { hasPermission } from "@/lib/rbac/hasPermission";
import { assertCanRespondToCircular } from "./assertCanRespondToCircular";
import type { ProfileRow } from "@/lib/auth/getCurrentProfile";

describe("assertCanRespondToCircular", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws AuthenticationError if profile is null or has no school/department", async () => {
    await expect(assertCanRespondToCircular(null)).rejects.toThrow(
      "Must belong to a department to respond",
    );

    await expect(assertCanRespondToCircular(null)).rejects.toThrow(
      "Must belong to a department to respond",
    );

    const noDept = { id: "u-1", department_id: null } as ProfileRow;
    await expect(assertCanRespondToCircular(noDept)).rejects.toThrow(
      "Must belong to a department to respond",
    );
  });

  it("throws ForbiddenError if user lacks circular.respond permission", async () => {
    vi.mocked(hasPermission).mockResolvedValue(false);
    const profile = { id: "u-1", department_id: "d-1" } as ProfileRow;

    await expect(assertCanRespondToCircular(profile)).rejects.toThrow("Unauthorized");
    expect(hasPermission).toHaveBeenCalledWith("circular.respond", undefined, "d-1");
  });

  it("returns schoolId and departmentId when authorized", async () => {
    vi.mocked(hasPermission).mockResolvedValue(true);
    const profile = { id: "u-1", department_id: "d-1" } as ProfileRow;

    const result = await assertCanRespondToCircular(profile);
    expect(result).toEqual({ schoolId: "singleton", departmentId: "d-1" });
  });
});
