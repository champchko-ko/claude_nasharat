import { describe, it, expect } from "vitest";
import { buildBackupManifest } from "./buildBackupManifest";
import { validateBackupPayload } from "./validateBackupPayload";
import type { DatabaseBackupPayload } from "./types";

function makePayload(
  overrides: Partial<DatabaseBackupPayload["metadata"]> = {},
): DatabaseBackupPayload {
  const tables: DatabaseBackupPayload["tables"] = {
    departments: [{ id: "d1", school_id: "school-1", name_en: "IT" }],
  };

  return {
    metadata: {
      ...buildBackupManifest({
        exportedBy: "user-1",
        scope: "school",
        schoolId: "school-1",
        schoolName: "Test School",
        tables,
      }),
      ...overrides,
    },
    tables,
  };
}

describe("validateBackupPayload", () => {
  it("accepts a freshly built payload", () => {
    expect(validateBackupPayload(makePayload()).metadata.scope).toBe("school");
  });

  it("rejects a file whose tables no longer match its checksum", () => {
    const payload = makePayload();
    payload.tables.departments = [{ id: "d2", school_id: "school-1", name_en: "Tampered" }];

    expect(() => validateBackupPayload(payload)).toThrow(/checksum/);
  });

  it("rejects a school-scoped file carrying another school's row", () => {
    const payload = makePayload();
    payload.tables.departments = [{ id: "d1", school_id: "school-2", name_en: "Foreign" }];
    payload.metadata.checksum = undefined;

    expect(() => validateBackupPayload(payload)).toThrow(/outside the restore target/);
  });

  it("rejects a version newer than this build understands", () => {
    expect(() => validateBackupPayload(makePayload({ version: 99 }))).toThrow(
      /Invalid backup JSON format/,
    );
  });

  it("rejects a school-scoped file with no school id", () => {
    const payload = makePayload({ schoolId: null });
    expect(() => validateBackupPayload(payload)).toThrow(/must name its school/);
  });
});
