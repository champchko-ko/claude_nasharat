import { describe, it, expect, vi } from "vitest";
import { uploadCircularDocument } from "./uploadCircularDocument";
import type { SupabaseClient } from "@supabase/supabase-js";

const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];

describe("uploadCircularDocument", () => {
  it("rejects invalid MIME types", async () => {
    const supabase = {} as SupabaseClient;
    const file = new File(["test-content"], "script.exe", { type: "application/x-msdownload" });

    const result = await uploadCircularDocument(supabase, {
      file,
      schoolId: "school-1",
      circularId: "circ-1",
      uploadedBy: "user-1",
    });

    expect(result.error).toBe("Invalid document format. Only PDF, JPG, PNG, and WebP are allowed.");
  });

  it("rejects files larger than 10MB", async () => {
    const supabase = {} as SupabaseClient;
    const largeFile = new File([new Uint8Array(PDF_BYTES)], "big.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(largeFile, "size", { value: 11 * 1024 * 1024 });

    const result = await uploadCircularDocument(supabase, {
      file: largeFile,
      schoolId: "school-1",
      circularId: "circ-1",
      uploadedBy: "user-1",
    });

    expect(result.error).toBe("File exceeds 10MB limit.");
  });

  it("rejects content that does not match the declared PDF type", async () => {
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      storage: { from: vi.fn(() => ({ upload: uploadMock })) },
    } as unknown as SupabaseClient;

    const file = new File(["<html>not a pdf</html>"], "announcement.pdf", {
      type: "application/pdf",
    });

    const result = await uploadCircularDocument(supabase, {
      file,
      schoolId: "school-1",
      circularId: "circ-1",
      uploadedBy: "user-1",
    });

    expect(result.error).toBe("File content does not match its declared type.");
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("uploads valid PDF within size limit", async () => {
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    const supabase = {
      storage: {
        from: vi.fn(() => ({
          upload: uploadMock,
        })),
      },
      from: vi.fn(() => ({
        insert: insertMock,
      })),
    } as unknown as SupabaseClient;

    const file = new File([new Uint8Array(PDF_BYTES)], "announcement.pdf", {
      type: "application/pdf",
    });

    const result = await uploadCircularDocument(supabase, {
      file,
      schoolId: "school-1",
      circularId: "circ-1",
      uploadedBy: "user-1",
    });

    expect(result.error).toBeUndefined();
    expect(uploadMock).toHaveBeenCalled();
  });
});
