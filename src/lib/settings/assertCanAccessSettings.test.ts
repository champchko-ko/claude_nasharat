import { describe, expect, it, vi } from "vitest";
import { assertCanAccessSettings } from "./assertCanAccessSettings";
import { getCurrentProfile, type ProfileRow } from "@/lib/auth/getCurrentProfile";
import { getEffectivePermissions } from "@/lib/rbac/getEffectivePermissions";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";

vi.mock("@/lib/auth/getCurrentProfile", () => ({
  getCurrentProfile: vi.fn(),
}));

vi.mock("@/lib/rbac/getEffectivePermissions", () => ({
  getEffectivePermissions: vi.fn(),
}));

vi.mock("@/lib/auth/isPlatformOwner", () => ({
  isPlatformOwner: vi.fn(),
}));

describe("assertCanAccessSettings", () => {
  it("denies access if profile is null", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValueOnce(null);
    const res = await assertCanAccessSettings();
    expect(res.allowed).toBe(false);
  });

  it("allows access if user is platform owner", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValueOnce({
      id: "u1",
      full_name: "Owner",
    } as unknown as ProfileRow);
    vi.mocked(getEffectivePermissions).mockResolvedValueOnce([]);
    vi.mocked(isPlatformOwner).mockResolvedValueOnce(true);

    const res = await assertCanAccessSettings();
    expect(res.allowed).toBe(true);
    expect(res.isOwner).toBe(true);
  });

  it("denies access if user has only department_head permissions", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValueOnce({
      id: "u2",
      full_name: "Dept Head",
    } as unknown as ProfileRow);
    vi.mocked(getEffectivePermissions).mockResolvedValueOnce([
      "circular.respond",
      "maintenance.create",
      "reports.view",
    ]);
    vi.mocked(isPlatformOwner).mockResolvedValueOnce(false);

    const res = await assertCanAccessSettings();
    expect(res.allowed).toBe(false);
  });

  it("allows access if user has settings.school.update permission", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValueOnce({
      id: "u3",
      full_name: "Admin",
    } as unknown as ProfileRow);
    vi.mocked(getEffectivePermissions).mockResolvedValueOnce(["settings.school.update"]);
    vi.mocked(isPlatformOwner).mockResolvedValueOnce(false);

    const res = await assertCanAccessSettings();
    expect(res.allowed).toBe(true);
  });
});
