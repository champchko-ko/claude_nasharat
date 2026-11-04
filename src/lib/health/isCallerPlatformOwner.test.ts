import { beforeEach, describe, expect, it, vi } from "vitest";
import { isCallerPlatformOwner } from "./isCallerPlatformOwner";

const mockGetCurrentProfile = vi.fn();
const mockIsPlatformOwner = vi.fn();

vi.mock("@/lib/auth/getCurrentProfile", () => ({
  getCurrentProfile: () => mockGetCurrentProfile(),
}));

vi.mock("@/lib/auth/isPlatformOwner", () => ({
  isPlatformOwner: (id: string) => mockIsPlatformOwner(id),
}));

describe("isCallerPlatformOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when user has no active profile", async () => {
    mockGetCurrentProfile.mockResolvedValueOnce(null);
    expect(await isCallerPlatformOwner()).toBe(false);
  });

  it("returns true when caller is a platform owner", async () => {
    mockGetCurrentProfile.mockResolvedValueOnce({ id: "user-owner" });
    mockIsPlatformOwner.mockResolvedValueOnce(true);
    expect(await isCallerPlatformOwner()).toBe(true);
  });

  it("returns false when caller is not a platform owner", async () => {
    mockGetCurrentProfile.mockResolvedValueOnce({ id: "user-regular" });
    mockIsPlatformOwner.mockResolvedValueOnce(false);
    expect(await isCallerPlatformOwner()).toBe(false);
  });
});
