import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadAttachmentFile } from "./downloadAttachmentFile";

describe("downloadAttachmentFile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates object url and triggers click on anchor element", async () => {
    const mockBlob = new Blob(["test-content"], { type: "text/plain" });
    globalThis.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(mockBlob),
    });

    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    await downloadAttachmentFile("https://example.com/file.jpg", "file.jpg");

    expect(globalThis.fetch).toHaveBeenCalledWith("https://example.com/file.jpg");
    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });
});
