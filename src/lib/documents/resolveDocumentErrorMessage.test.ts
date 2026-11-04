import { describe, it, expect } from "vitest";
import { resolveDocumentErrorMessage } from "./resolveDocumentErrorMessage";

describe("resolveDocumentErrorMessage", () => {
  const mockTranslate = (key: string) => `translated:${key}`;

  it("returns default saveError if rawError is empty", () => {
    expect(resolveDocumentErrorMessage(null, mockTranslate)).toBe("translated:saveError");
    expect(resolveDocumentErrorMessage(undefined, mockTranslate)).toBe("translated:saveError");
  });

  it("maps unauthorized and forbidden errors", () => {
    expect(
      resolveDocumentErrorMessage("Unauthorized to manage school documents", mockTranslate),
    ).toBe("translated:unauthorizedError");
    expect(resolveDocumentErrorMessage("forbidden", mockTranslate)).toBe(
      "translated:unauthorizedError",
    );
  });

  it("maps file size limit errors", () => {
    expect(resolveDocumentErrorMessage("File exceeds the 20MB limit", mockTranslate)).toBe(
      "translated:fileTooLarge",
    );
  });

  it("maps format and mime errors", () => {
    expect(
      resolveDocumentErrorMessage(
        "Invalid file format. Allowed: PDF, JPEG, PNG, WebP",
        mockTranslate,
      ),
    ).toBe("translated:invalidFileFormat");
  });

  it("maps content mismatch errors", () => {
    expect(
      resolveDocumentErrorMessage("File content does not match its declared type", mockTranslate),
    ).toBe("translated:fileMismatch");
  });

  it("maps title required errors", () => {
    expect(resolveDocumentErrorMessage("Document title is required", mockTranslate)).toBe(
      "translated:titleRequired",
    );
  });

  it("returns raw error if not recognized", () => {
    expect(resolveDocumentErrorMessage("Something unexpected happened", mockTranslate)).toBe(
      "Something unexpected happened",
    );
  });
});
