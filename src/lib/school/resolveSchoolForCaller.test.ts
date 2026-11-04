import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockIsOwner, mockGetFirstSchool } = vi.hoisted(() => ({
  mockIsOwner: vi.fn(),
  mockGetFirstSchool: vi.fn(),
}));

vi.mock("@/lib/auth/isPlatformOwner", () => ({
  isPlatformOwner: (id: string) => mockIsOwner(id),
}));

vi.mock("./getFirstActiveSchoolId", () => ({
  getFirstActiveSchoolId: () => mockGetFirstSchool(),
}));

import { resolveSchoolForCaller } from "./resolveSchoolForCaller";

describe("resolveSchoolForCaller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns caller school_id when profile has a school", async () => {
    const res = await resolveSchoolForCaller({ id: "user-1", school_id: "school-123" });
    expect(res).toBe("school-123");
    expect(mockIsOwner).not.toHaveBeenCalled();
    expect(mockGetFirstSchool).not.toHaveBeenCalled();
  });

  it("returns null when profile is null", async () => {
    const res = await resolveSchoolForCaller(null);
    expect(res).toBeNull();
  });

  it("resolves fallback first active school only when caller is platform owner", async () => {
    mockIsOwner.mockResolvedValue(true);
    mockGetFirstSchool.mockResolvedValue("first-school-uuid");

    const res = await resolveSchoolForCaller({ id: "owner-1", school_id: null });
    expect(res).toBe("first-school-uuid");
    expect(mockIsOwner).toHaveBeenCalledWith("owner-1");
    expect(mockGetFirstSchool).toHaveBeenCalled();
  });

  it("returns null for non-owner caller without school_id (preventing cross-tenant fallback)", async () => {
    mockIsOwner.mockResolvedValue(false);

    const res = await resolveSchoolForCaller({ id: "dissociated-user", school_id: null });
    expect(res).toBeNull();
    expect(mockIsOwner).toHaveBeenCalledWith("dissociated-user");
    expect(mockGetFirstSchool).not.toHaveBeenCalled();
  });
});
