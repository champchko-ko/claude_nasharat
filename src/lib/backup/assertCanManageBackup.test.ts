import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { assertCanManageBackup } from "./assertCanManageBackup";
import * as getCurrentProfileModule from "@/lib/auth/getCurrentProfile";
import * as isPlatformOwnerModule from "@/lib/auth/isPlatformOwner";

describe("assertCanManageBackup", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns allowed: false when user is not authenticated", async () => {
    vi.spyOn(getCurrentProfileModule, "getCurrentProfile").mockResolvedValue(null);

    const res = await assertCanManageBackup();
    expect(res.allowed).toBe(false);
    expect(res.isOwner).toBe(false);
  });

  it("allows access if user is platform owner", async () => {
    vi.spyOn(getCurrentProfileModule, "getCurrentProfile").mockResolvedValue({
      id: "owner-1",
      email: "owner@school.edu",
      full_name: "Platform Owner",
      job_title: null,
      department_id: null,
      is_active: true,
    });
    vi.spyOn(isPlatformOwnerModule, "isPlatformOwner").mockResolvedValue(true);

    const res = await assertCanManageBackup();
    expect(res.allowed).toBe(true);
    expect(res.isOwner).toBe(true);
  });

  it("denies access to school managers", async () => {
    vi.spyOn(getCurrentProfileModule, "getCurrentProfile").mockResolvedValue({
      id: "manager-1",
      email: "principal@school.edu",
      full_name: "School Principal",
      job_title: null,
      department_id: null,
      is_active: true,
    });
    vi.spyOn(isPlatformOwnerModule, "isPlatformOwner").mockResolvedValue(false);

    const res = await assertCanManageBackup();
    expect(res.allowed).toBe(false);
    expect(res.isOwner).toBe(false);
  });

  it("denies access to regular staff members or department heads", async () => {
    vi.spyOn(getCurrentProfileModule, "getCurrentProfile").mockResolvedValue({
      id: "staff-1",
      email: "staff@school.edu",
      full_name: "Teacher",
      job_title: null,
      department_id: "dept-1",
      is_active: true,
    });
    vi.spyOn(isPlatformOwnerModule, "isPlatformOwner").mockResolvedValue(false);

    const res = await assertCanManageBackup();
    expect(res.allowed).toBe(false);
    expect(res.isOwner).toBe(false);
  });
});
