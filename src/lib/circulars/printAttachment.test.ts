import { describe, it, expect, vi, beforeEach } from "vitest";
import { printAttachment } from "./printAttachment";

describe("printAttachment", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when url is not provided", async () => {
    const appendSpy = vi.spyOn(document.body, "appendChild");
    await printAttachment(undefined);
    expect(appendSpy).not.toHaveBeenCalled();
    appendSpy.mockRestore();
  });

  it("creates hidden iframe for in-app printing without opening a window", async () => {
    const mockBlob = new Blob(["pdf"], { type: "application/pdf" });
    globalThis.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(mockBlob),
    });

    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    const appendSpy = vi.spyOn(document.body, "appendChild");

    await printAttachment("https://example.com/test.pdf");

    expect(appendSpy).toHaveBeenCalled();
    createObjectURLSpy.mockRestore();
    appendSpy.mockRestore();
  });
});
