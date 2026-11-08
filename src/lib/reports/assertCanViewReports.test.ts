import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { assertCanViewReports } from "./assertCanViewReports";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { resolveSchoolForCaller } from "@/lib/school/resolveSchoolForCaller";
import { getEffectivePermissions } from "@/lib/rbac/getEffectivePermissions";

vi.mock("@/lib/auth/getCurrentProfile", () => ({
  getCurrentProfile: vi.fn(),
}));

vi.mock("@/lib/auth/isPlatformOwner", () => ({
  isPlatformOwner: vi.fn(),
}));

vi.mock("@/lib/school/resolveSchoolForCaller", () => ({
  resolveSchoolForCaller: vi.fn(),
}));

vi.mock("@/lib/rbac/getEffectivePermissions", () => ({
  getEffectivePermissions: vi.fn(),
}));

describe("assertCanViewReports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns authorized with null scope for platform owner", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "owner-1",
      full_name: "Owner",
    } as unknown as Awaited<ReturnType<typeof getCurrentProfile>>);

    vi.mocked(resolveSchoolForCaller).mockResolvedValue("sch-1");

    vi.mocked(getEffectivePermissions).mockResolvedValue([]);
    vi.mocked(isPlatformOwner).mockResolvedValue(true);

    const res = await assertCanViewReports();
    expect(res.authorized).toBe(true);
    if (res.authorized) {
      expect(res.scopedDepartmentId).toBeNull();
      expect(res.schoolId).toBe("sch-1");
    }
  });

  it("returns authorized with null scope for school manager", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "mgr-1",
      full_name: "Manager",
      department_id: "dept-1",
    } as unknown as Awaited<ReturnType<typeof getCurrentProfile>>);

    vi.mocked(resolveSchoolForCaller).mockResolvedValue("sch-1");

    vi.mocked(getEffectivePermissions).mockResolvedValue(["settings.school.update"]);
    vi.mocked(isPlatformOwner).mockResolvedValue(false);

    const res = await assertCanViewReports();
    expect(res.authorized).toBe(true);
    if (res.authorized) {
      expect(res.scopedDepartmentId).toBeNull();
    }
  });

  it("returns authorized with scopedDepartmentId for department head holding reports.view", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "head-1",
      full_name: "Dept Head",
      department_id: "dept-42",
    } as unknown as Awaited<ReturnType<typeof getCurrentProfile>>);

    vi.mocked(resolveSchoolForCaller).mockResolvedValue("sch-1");

    vi.mocked(getEffectivePermissions).mockResolvedValue(["reports.view"]);
    vi.mocked(isPlatformOwner).mockResolvedValue(false);

    const res = await assertCanViewReports();
    expect(res.authorized).toBe(true);
    if (res.authorized) {
      expect(res.scopedDepartmentId).toBe("dept-42");
    }
  });

  it("rejects user holding reports.view without a department assignment", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "user-1",
      full_name: "Staff",
      department_id: null,
    } as unknown as Awaited<ReturnType<typeof getCurrentProfile>>);

    vi.mocked(resolveSchoolForCaller).mockResolvedValue("sch-1");

    vi.mocked(getEffectivePermissions).mockResolvedValue(["reports.view"]);
    vi.mocked(isPlatformOwner).mockResolvedValue(false);

    const res = await assertCanViewReports();
    expect(res.authorized).toBe(false);
  });

  it("rejects user lacking report permissions", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "user-1",
      full_name: "Staff",
      department_id: "dept-1",
    } as unknown as Awaited<ReturnType<typeof getCurrentProfile>>);

    vi.mocked(resolveSchoolForCaller).mockResolvedValue("sch-1");

    vi.mocked(getEffectivePermissions).mockResolvedValue(["circular.create"]);
    vi.mocked(isPlatformOwner).mockResolvedValue(false);

    const res = await assertCanViewReports();
    expect(res.authorized).toBe(false);
  });
});
