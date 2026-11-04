import { describe, it, expect, vi } from "vitest";
import { warnOnDataTruncation } from "./warnOnDataTruncation";

describe("warnOnDataTruncation", () => {
  it("returns false and does not warn when row count is below limit", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = warnOnDataTruncation(999, "testQuery");

    expect(result).toBe(false);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("returns true and logs warning when row count meets limit", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = warnOnDataTruncation(1000, "testQuery");

    expect(result).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[DataTruncationWarning] Query "testQuery" returned 1000 rows'),
    );
    warnSpy.mockRestore();
  });

  it("supports custom limits", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = warnOnDataTruncation(50, "testQuery", 50);

    expect(result).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("reaching the PostgREST max_rows ceiling (50)"),
    );
    warnSpy.mockRestore();
  });
});
