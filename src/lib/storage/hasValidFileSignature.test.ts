import { describe, it, expect } from "vitest";
import { hasValidFileSignature } from "./hasValidFileSignature";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const SVG = new Uint8Array([0x3c, 0x73, 0x76, 0x67, 0x3e]); // "<svg>"

describe("hasValidFileSignature", () => {
  it("accepts the four supported formats", () => {
    expect(hasValidFileSignature(PNG, "image/png")).toBe(true);
    expect(hasValidFileSignature(JPEG, "image/jpeg")).toBe(true);
    expect(hasValidFileSignature(WEBP, "image/webp")).toBe(true);
    expect(hasValidFileSignature(PDF, "application/pdf")).toBe(true);
  });

  it("rejects content that does not match the declared type", () => {
    expect(hasValidFileSignature(SVG, "image/png")).toBe(false);
    expect(hasValidFileSignature(SVG, "image/jpeg")).toBe(false);
    expect(
      hasValidFileSignature(
        new TextEncoder().encode("<html><script>alert(1)</script>"),
        "image/png",
      ),
    ).toBe(false);
    expect(hasValidFileSignature(PDF, "image/png")).toBe(false);
    expect(hasValidFileSignature(PNG, "application/pdf")).toBe(false);
  });

  it("rejects unknown types and truncated input", () => {
    expect(hasValidFileSignature(PNG, "image/svg+xml")).toBe(false);
    expect(hasValidFileSignature(PNG, "image/gif")).toBe(false);
    expect(hasValidFileSignature(new Uint8Array([0x89, 0x50]), "image/png")).toBe(false);
    expect(hasValidFileSignature(new Uint8Array(), "image/jpeg")).toBe(false);
  });
});
