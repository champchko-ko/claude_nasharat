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

  it("returns the singleton school for any authenticated profile", async () => {
    mockGetFirstSchool.mockResolvedValue("school-123");
    const res = await resolveSchoolForCaller({ id: "user-1" });
    expect(res).toBe("school-123");
    expect(mockGetFirstSchool).toHaveBeenCalled();
  });

  it("returns null when profile is null", async () => {
    const res = await resolveSchoolForCaller(null);
    expect(res).toBeNull();
  });

  it("resolves the singleton school for the owner", async () => {
    mockGetFirstSchool.mockResolvedValue("first-school-uuid");

    const res = await resolveSchoolForCaller({ id: "owner-1" });
    expect(res).toBe("first-school-uuid");
    expect(mockGetFirstSchool).toHaveBeenCalled();
  });

  it("returns null when no active school exists", async () => {
    mockGetFirstSchool.mockResolvedValue(null);
    const res = await resolveSchoolForCaller({ id: "dissociated-user" });
    expect(res).toBeNull();
  });
});
