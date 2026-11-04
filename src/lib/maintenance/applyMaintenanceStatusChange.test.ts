import { describe, it, expect, vi, beforeEach } from "vitest";
import { applyMaintenanceStatusChange } from "./applyMaintenanceStatusChange";
import { NotFoundError } from "../errors/NotFoundError";

vi.mock("./assertValidMaintenancePhoto", () => ({
  assertValidMaintenancePhoto: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./handleOptionalPhoto", () => ({
  handleOptionalPhoto: vi.fn().mockResolvedValue({}),
}));

vi.mock("./insertMaintenanceUpdate", () => ({
  insertMaintenanceUpdate: vi.fn().mockResolvedValue({}),
}));

describe("applyMaintenanceStatusChange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies status change with school_id filter and logs the update", async () => {
    const selectMock = vi.fn().mockResolvedValue({
      data: [{ id: "req-1" }],
      error: null,
    });
    const eqSchoolMock = vi.fn().mockReturnValue({ select: selectMock });
    const eqIdMock = vi.fn().mockReturnValue({ eq: eqSchoolMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqIdMock });
    const fromMock = vi.fn().mockReturnValue({ update: updateMock });

    const supabase = {
      from: fromMock,
    } as unknown as Parameters<typeof applyMaintenanceStatusChange>[0];

    await applyMaintenanceStatusChange(supabase, {
      requestId: "req-1",
      schoolId: "sch-1",
      userId: "usr-1",
      targetStatus: "in_progress",
      oldStatus: "assigned",
      reason: "Starting work",
    });

    expect(fromMock).toHaveBeenCalledWith("maintenance_requests");
    expect(eqIdMock).toHaveBeenCalledWith("id", "req-1");
    expect(eqSchoolMock).toHaveBeenCalledWith("school_id", "sch-1");
    expect(selectMock).toHaveBeenCalledWith("id");
  });

  it("throws NotFoundError when update affects 0 rows (foreign requestId)", async () => {
    const selectMock = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const eqSchoolMock = vi.fn().mockReturnValue({ select: selectMock });
    const eqIdMock = vi.fn().mockReturnValue({ eq: eqSchoolMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqIdMock });
    const fromMock = vi.fn().mockReturnValue({ update: updateMock });

    const supabase = {
      from: fromMock,
    } as unknown as Parameters<typeof applyMaintenanceStatusChange>[0];

    await expect(
      applyMaintenanceStatusChange(supabase, {
        requestId: "foreign-req",
        schoolId: "sch-1",
        userId: "usr-1",
        targetStatus: "in_progress",
        oldStatus: "assigned",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws when insertMaintenanceUpdate returns an error", async () => {
    const { insertMaintenanceUpdate } = await import("./insertMaintenanceUpdate");
    vi.mocked(insertMaintenanceUpdate).mockResolvedValueOnce({
      error: "Failed to write audit update",
    });

    const selectMock = vi.fn().mockResolvedValue({
      data: [{ id: "req-1" }],
      error: null,
    });
    const eqSchoolMock = vi.fn().mockReturnValue({ select: selectMock });
    const eqIdMock = vi.fn().mockReturnValue({ eq: eqSchoolMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqIdMock });
    const fromMock = vi.fn().mockReturnValue({ update: updateMock });

    const supabase = {
      from: fromMock,
    } as unknown as Parameters<typeof applyMaintenanceStatusChange>[0];

    await expect(
      applyMaintenanceStatusChange(supabase, {
        requestId: "req-1",
        schoolId: "sch-1",
        userId: "usr-1",
        targetStatus: "in_progress",
        oldStatus: "assigned",
      }),
    ).rejects.toThrow("Failed to write audit update");
  });
});
