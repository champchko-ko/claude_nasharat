import { describe, it, expect } from "vitest";
import { computeBackupChecksum } from "./computeBackupChecksum";

describe("computeBackupChecksum", () => {
  it("is stable when object keys appear in a different order", () => {
    const a = { departments: [{ id: "d1", name_en: "IT" }] };
    const b = { departments: [{ name_en: "IT", id: "d1" }] };

    expect(computeBackupChecksum(a)).toBe(computeBackupChecksum(b));
  });

  it("changes when a row changes", () => {
    const a = { departments: [{ id: "d1", name_en: "IT" }] };
    const b = { departments: [{ id: "d1", name_en: "HR" }] };

    expect(computeBackupChecksum(a)).not.toBe(computeBackupChecksum(b));
  });

  it("is a lowercase SHA-256 digest", () => {
    expect(computeBackupChecksum({})).toMatch(/^[a-f0-9]{64}$/);
  });
});
