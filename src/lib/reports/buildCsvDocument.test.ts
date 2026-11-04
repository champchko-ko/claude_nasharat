import { describe, it, expect } from "vitest";
import { buildCsvDocument } from "./buildCsvDocument";

describe("buildCsvDocument", () => {
  it("prepends the UTF-8 BOM to ensure Arabic and Unicode text renders properly in Excel", () => {
    const csv = buildCsvDocument(["Header"], [["Data"]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("formats header and rows joined with CRLF", () => {
    const headers = ["Title", "Count", "Formula"];
    const rows = [
      ["Item A", 10, "=1+2"],
      ["Item B, Special", 20, "Normal"],
    ];

    const csv = buildCsvDocument(headers, rows);
    const lines = csv.slice(1).split("\r\n"); // omit BOM

    expect(lines[0]).toBe("Title,Count,Formula");
    expect(lines[1]).toBe("Item A,10,'=1+2");
    expect(lines[2]).toBe('"Item B, Special",20,Normal');
  });

  it("handles empty rows array correctly", () => {
    const headers = ["Col1", "Col2"];
    const csv = buildCsvDocument(headers, []);
    expect(csv).toBe("\uFEFFCol1,Col2");
  });
});
