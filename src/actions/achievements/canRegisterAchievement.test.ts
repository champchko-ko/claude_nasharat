import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { canRegisterAchievement } from "./canRegisterAchievement";
import * as authModule from "@/lib/auth/isPlatformOwner";

describe("canRegisterAchievement", () => {
  it("returns false if userId is missing", async () => {
    const result = await canRegisterAchievement("school-1", null, null, null);
    expect(result).toBe(false);
  });

  it("returns false if user is not a platform owner", async () => {
    vi.spyOn(authModule, "isPlatformOwner").mockResolvedValueOnce(false);
    const result = await canRegisterAchievement("school-1", null, null, "user-1");
    expect(result).toBe(false);
  });

  it("returns true if user is a platform owner even if schoolId is not set", async () => {
    vi.spyOn(authModule, "isPlatformOwner").mockResolvedValueOnce(true);
    const result = await canRegisterAchievement(null, null, null, "owner-1");
    expect(result).toBe(true);
  });
});
