import { describe, it, expect } from "vitest";
import { formatAttachmentFileName } from "./formatAttachmentFileName";

describe("formatAttachmentFileName", () => {
  it("strips timestamp prefix and suffix", () => {
    expect(
      formatAttachmentFileName(
        "sch-1/circ-1/1792798038005_26-04-30_at_12.32.25_PM.jpeg_1792798038005",
      ),
    ).toBe("26-04-30_at_12.32.25_PM.jpeg");
  });

  it("handles simple filenames without prefixes", () => {
    expect(formatAttachmentFileName("annual_report.pdf")).toBe("annual_report.pdf");
  });
});
