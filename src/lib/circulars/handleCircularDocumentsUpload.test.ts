import { describe, it, expect, vi } from "vitest";
import { handleCircularDocumentsUpload } from "./handleCircularDocumentsUpload";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as uploaderModule from "./uploadCircularDocument";

describe("handleCircularDocumentsUpload", () => {
  it("returns empty object when no documents are attached", async () => {
    const supabase = {} as SupabaseClient;
    const formData = new FormData();
    const spy = vi.spyOn(uploaderModule, "uploadCircularDocument");

    const result = await handleCircularDocumentsUpload(supabase, {
      formData,
      schoolId: "school-1",
      circularId: "circ-1",
      uploadedBy: "user-1",
    });

    expect(result).toEqual({});
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("stops and returns error on first document failure without attempting second", async () => {
    const supabase = {} as SupabaseClient;
    const formData = new FormData();
    const file1 = new File(["doc1"], "first.pdf", { type: "application/pdf" });
    const file2 = new File(["doc2"], "second.pdf", { type: "application/pdf" });
    formData.append("documents", file1);
    formData.append("documents", file2);

    const spy = vi
      .spyOn(uploaderModule, "uploadCircularDocument")
      .mockResolvedValueOnce({ error: "Storage error on first" })
      .mockResolvedValueOnce({});

    const result = await handleCircularDocumentsUpload(supabase, {
      formData,
      schoolId: "school-1",
      circularId: "circ-1",
      uploadedBy: "user-1",
    });

    expect(result.error).toBe("first.pdf: Storage error on first");
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("uploads all valid documents and returns success", async () => {
    const supabase = {} as SupabaseClient;
    const formData = new FormData();
    const file1 = new File(["doc1"], "first.pdf", { type: "application/pdf" });
    const file2 = new File(["doc2"], "second.pdf", { type: "application/pdf" });
    formData.append("documents", file1);
    formData.append("documents", file2);

    const spy = vi
      .spyOn(uploaderModule, "uploadCircularDocument")
      .mockResolvedValue({ error: undefined });

    const result = await handleCircularDocumentsUpload(supabase, {
      formData,
      schoolId: "school-1",
      circularId: "circ-1",
      uploadedBy: "user-1",
    });

    expect(result.error).toBeUndefined();
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
