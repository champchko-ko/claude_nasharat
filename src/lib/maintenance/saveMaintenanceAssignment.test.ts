import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveMaintenanceAssignment } from "./saveMaintenanceAssignment";

vi.mock("./insertMaintenanceUpdate", () => ({
  insertMaintenanceUpdate: vi.fn().mockResolvedValue({}),
}));

describe("saveMaintenanceAssignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error and stops if deactivating prior assignments fails", async () => {
    const eqSchoolMock = vi.fn().mockResolvedValue({
      error: { message: "Deactivation failed" },
    });
    const eqReqMock = vi.fn().mockReturnValue({ eq: eqSchoolMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqReqMock });
    const insertMock = vi.fn();

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "maintenance_assignments") {
          return { update: updateMock, insert: insertMock };
        }
        return {};
      }),
    } as unknown as Parameters<typeof saveMaintenanceAssignment>[0];

    const result = await saveMaintenanceAssignment(supabase, {
      requestId: "req-1",
      schoolId: "sch-1",
      operatorId: "op-1",
      assignedBy: "admin-1",
      currentStatus: "submitted",
      currentOperatorId: null,
      currentPriority: "medium",
    });

    expect(result).toEqual({ error: "Deactivation failed" });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("proceeds with insert and update when deactivation succeeds", async () => {
    const deactEqSchool = vi.fn().mockResolvedValue({ error: null });
    const deactEqReq = vi.fn().mockReturnValue({ eq: deactEqSchool });
    const deactUpdate = vi.fn().mockReturnValue({ eq: deactEqReq });

    const insertMock = vi.fn().mockResolvedValue({ error: null });

    const reqEqSchool = vi.fn().mockResolvedValue({ error: null });
    const reqEqId = vi.fn().mockReturnValue({ eq: reqEqSchool });
    const reqUpdate = vi.fn().mockReturnValue({ eq: reqEqId });

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "maintenance_assignments") {
          return { update: deactUpdate, insert: insertMock };
        }
        if (table === "maintenance_requests") {
          return { update: reqUpdate };
        }
        return {};
      }),
    } as unknown as Parameters<typeof saveMaintenanceAssignment>[0];

    const result = await saveMaintenanceAssignment(supabase, {
      requestId: "req-1",
      schoolId: "sch-1",
      operatorId: "op-1",
      assignedBy: "admin-1",
      currentStatus: "submitted",
      currentOperatorId: null,
      currentPriority: "medium",
    });

    expect(result).toEqual({});
    expect(deactUpdate).toHaveBeenCalledWith({ is_active: false });
    expect(insertMock).toHaveBeenCalled();
    expect(reqUpdate).toHaveBeenCalledWith({
      status: "assigned",
      updated_at: expect.any(String),
    });
  });
});
