import { describe, it, expect } from "vitest";
import { assertValidCircularDocuments } from "./assertValidCircularDocuments";
import { ValidationError } from "@/lib/errors/ValidationError";

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];

describe("assertValidCircularDocuments", () => {
  it("resolves without throwing when formData has no documents", async () => {
    const formData = new FormData();
    await expect(assertValidCircularDocuments(formData)).resolves.toBeUndefined();
  });

  it("resolves without throwing when formData contains empty file", async () => {
    const formData = new FormData();
    formData.append("documents", new File([], "empty.pdf", { type: "application/pdf" }));
    await expect(assertValidCircularDocuments(formData)).resolves.toBeUndefined();
  });

  it("throws ValidationError when document has invalid MIME", async () => {
    const formData = new FormData();
    formData.append(
      "documents",
      new File(["exe content"], "bad.exe", { type: "application/x-msdownload" }),
    );
    await expect(assertValidCircularDocuments(formData)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when document signature does not match declared type", async () => {
    const formData = new FormData();
    formData.append("documents", new File(["not a pdf"], "bad.pdf", { type: "application/pdf" }));
    await expect(assertValidCircularDocuments(formData)).rejects.toThrow(ValidationError);
  });

  it("resolves without throwing when all documents are valid", async () => {
    const formData = new FormData();
    formData.append(
      "documents",
      new File([new Uint8Array(PDF_MAGIC)], "good.pdf", { type: "application/pdf" }),
    );
    await expect(assertValidCircularDocuments(formData)).resolves.toBeUndefined();
  });
});
