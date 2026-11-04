import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createMaintenanceAction } from "./createMaintenanceAction";
import * as authModule from "@/lib/maintenance/assertCanCreateMaintenance";
import * as recordModule from "@/lib/maintenance/createMaintenanceRecord";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("createMaintenanceAction - upload validation upfront", () => {
  it("rejects invalid photo upfront and never creates a maintenance ticket", async () => {
    vi.spyOn(authModule, "assertCanCreateMaintenance").mockResolvedValue({
      profileId: "user-1",
      schoolId: "school-1",
      departmentId: "dept-1",
    });

    const createRecordSpy = vi.spyOn(recordModule, "createMaintenanceRecord");

    const formData = new FormData();
    formData.append("title", "Broken AC");
    formData.append("description", "Not cooling");
    formData.append("category", "electrical");
    formData.append("priority", "medium");
    formData.append(
      "photo",
      new File(["<svg>malicious</svg>"], "test.svg", { type: "image/svg+xml" }),
    );

    const result = await createMaintenanceAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    // Verification: createMaintenanceRecord was never called
    expect(createRecordSpy).not.toHaveBeenCalled();

    createRecordSpy.mockRestore();
    vi.restoreAllMocks();
  });
});
