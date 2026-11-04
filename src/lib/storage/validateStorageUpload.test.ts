import { describe, it, expect } from "vitest";
import { validateStorageUpload, type UploadRules } from "./validateStorageUpload";

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00];

const sampleRules: UploadRules = {
  allowedMime: ["image/png"],
  maxBytes: 1024,
  invalidFormatMessage: "Invalid format",
  tooLargeMessage: "Too large",
  contentMismatchMessage: "Signature mismatch",
};

describe("validateStorageUpload", () => {
  it("rejects file with disallowed MIME type", async () => {
    const file = new File(["sample"], "test.txt", { type: "text/plain" });
    const result = await validateStorageUpload(file, sampleRules);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Invalid format");
    }
  });

  it("rejects file exceeding maxBytes", async () => {
    const file = new File([new Uint8Array(PNG_MAGIC)], "test.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 2048 });

    const result = await validateStorageUpload(file, sampleRules);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Too large");
    }
  });

  it("rejects file whose signature does not match declared MIME", async () => {
    const file = new File(["not a png header"], "test.png", { type: "image/png" });

    const result = await validateStorageUpload(file, sampleRules);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Signature mismatch");
    }
  });

  it("accepts valid file and returns bytes", async () => {
    const file = new File([new Uint8Array(PNG_MAGIC)], "test.png", { type: "image/png" });

    const result = await validateStorageUpload(file, sampleRules);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bytes).toBeInstanceOf(Uint8Array);
      expect(result.bytes.length).toBe(PNG_MAGIC.length);
    }
  });
});
