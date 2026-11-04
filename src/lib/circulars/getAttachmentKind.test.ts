import { describe, it, expect } from "vitest";
import { getAttachmentKind } from "./getAttachmentKind";

describe("getAttachmentKind", () => {
  it("detects images by mime or extension", () => {
    expect(getAttachmentKind("test.jpg", "image/jpeg")).toBe("image");
    expect(getAttachmentKind("test.png")).toBe("image");
    expect(getAttachmentKind("photo.webp")).toBe("image");
  });

  it("detects pdfs by mime or extension", () => {
    expect(getAttachmentKind("doc.pdf", "application/pdf")).toBe("pdf");
    expect(getAttachmentKind("file.pdf")).toBe("pdf");
  });

  it("falls back to document for other files", () => {
    expect(getAttachmentKind("notes.docx")).toBe("document");
    expect(getAttachmentKind("data.xlsx")).toBe("document");
  });
});
