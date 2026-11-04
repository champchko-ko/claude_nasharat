import { describe, it, expect } from "vitest";
import { validateFormDataFiles } from "./validateFormDataFiles";

describe("validateFormDataFiles", () => {
  const options = {
    allowedMimes: ["image/png"],
    maxBytes: 1024 * 1024,
  };

  it("passes when no files are attached", () => {
    const formData = new FormData();
    const result = validateFormDataFiles(formData, "docs", options);
    expect(result.valid).toBe(true);
  });

  it("fails when an attached file violates rules", () => {
    const formData = new FormData();
    const file = new File(["bad content"], "test.txt", { type: "text/plain" });
    formData.append("docs", file);

    const result = validateFormDataFiles(formData, "docs", options);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file format");
  });
});
