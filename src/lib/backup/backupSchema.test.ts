import { describe, it, expect } from "vitest";
import { backupSchema } from "./backupSchema";

describe("backupSchema", () => {
  it("validates a proper database backup payload", () => {
    const valid = {
      metadata: {
        version: 1,
        exportedAt: new Date().toISOString(),
        exportedBy: "user-123",
        scope: "school",
        schoolId: "school-1",
        schoolName: "Test School",
      },
      tables: {
        departments: [{ id: "dept-1", name_ar: "قسم العلوم", school_id: "school-1" }],
        locations: [{ id: "loc-1", building: "A", school_id: "school-1" }],
      },
    };

    const res = backupSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("fails if version or metadata is missing or invalid", () => {
    const invalid = {
      metadata: {
        version: 0,
        exportedAt: "now",
        scope: "invalid_scope",
      },
      tables: {},
    };

    const res = backupSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});
