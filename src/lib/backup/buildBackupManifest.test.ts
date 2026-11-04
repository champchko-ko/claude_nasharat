import { describe, it, expect } from "vitest";
import { buildBackupManifest } from "./buildBackupManifest";
import { BACKUP_FORMAT_VERSION } from "./backupFormatVersion";

describe("buildBackupManifest", () => {
  it("records counts, total rows, checksum and exclusions", () => {
    const manifest = buildBackupManifest({
      exportedBy: "user-1",
      scope: "school",
      schoolId: "school-1",
      schoolName: "Test School",
      tables: {
        departments: [{ id: "d1" }, { id: "d2" }],
        locations: [{ id: "l1" }],
      },
    });

    expect(manifest.version).toBe(BACKUP_FORMAT_VERSION);
    expect(manifest.tableCounts).toEqual({ departments: 2, locations: 1 });
    expect(manifest.totalRows).toBe(3);
    expect(manifest.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.exclusions?.map((exclusion) => exclusion.item)).toContain("audit_logs");
  });

  it("counts an empty table as zero rather than omitting it", () => {
    const manifest = buildBackupManifest({
      exportedBy: "user-1",
      scope: "platform",
      schoolId: null,
      schoolName: null,
      tables: { departments: [], locations: [{ id: "l1" }] },
    });

    expect(manifest.tableCounts).toEqual({ departments: 0, locations: 1 });
    expect(manifest.totalRows).toBe(1);
  });
});
