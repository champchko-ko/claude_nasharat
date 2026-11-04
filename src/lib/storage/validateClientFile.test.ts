import { describe, it, expect } from "vitest";
import { validateClientFile } from "./validateClientFile";

describe("validateClientFile", () => {
  const options = {
    allowedMimes: ["image/jpeg", "image/png"],
    maxBytes: 1024 * 1024, // 1MB
  };

  it("accepts valid file matching allowed mime and under size limit", () => {
    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    const result = validateClientFile(file, options);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects file exceeding maxBytes", () => {
    const largeContent = new Uint8Array(2 * 1024 * 1024);
    const file = new File([largeContent], "large.png", { type: "image/png" });
    const result = validateClientFile(file, options);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exceeds");
  });

  it("rejects file with disallowed mime type", () => {
    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
    const result = validateClientFile(file, options);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file format");
  });
});
