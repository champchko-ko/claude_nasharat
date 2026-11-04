import { describe, it, expect, vi } from "vitest";
import { handleOptionalPhoto } from "./handleOptionalPhoto";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as uploaderModule from "./uploadMaintenancePhoto";

describe("handleOptionalPhoto", () => {
  it("does nothing and returns empty object when photo is null", async () => {
    const supabase = {} as SupabaseClient;
    const spy = vi.spyOn(uploaderModule, "uploadMaintenancePhoto");

    const result = await handleOptionalPhoto(supabase, null, {
      schoolId: "school-1",
      requestId: "req-1",
      uploadedBy: "user-1",
      kind: "report",
    });

    expect(result).toEqual({});
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does nothing and returns empty object when photo size is 0", async () => {
    const supabase = {} as SupabaseClient;
    const file = new File([], "empty.png", { type: "image/png" });
    const spy = vi.spyOn(uploaderModule, "uploadMaintenancePhoto");

    const result = await handleOptionalPhoto(supabase, file, {
      schoolId: "school-1",
      requestId: "req-1",
      uploadedBy: "user-1",
      kind: "report",
    });

    expect(result).toEqual({});
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("returns error from uploader when upload fails", async () => {
    const supabase = {} as SupabaseClient;
    const file = new File(["data"], "photo.png", { type: "image/png" });
    const spy = vi
      .spyOn(uploaderModule, "uploadMaintenancePhoto")
      .mockResolvedValueOnce({ error: "Storage quota exceeded" });

    const result = await handleOptionalPhoto(supabase, file, {
      schoolId: "school-1",
      requestId: "req-1",
      uploadedBy: "user-1",
      kind: "report",
    });

    expect(result.error).toBe("Storage quota exceeded");
    spy.mockRestore();
  });

  it("returns empty result on successful upload", async () => {
    const supabase = {} as SupabaseClient;
    const file = new File(["data"], "photo.png", { type: "image/png" });
    const spy = vi.spyOn(uploaderModule, "uploadMaintenancePhoto").mockResolvedValueOnce({});

    const result = await handleOptionalPhoto(supabase, file, {
      schoolId: "school-1",
      requestId: "req-1",
      uploadedBy: "user-1",
      kind: "report",
    });

    expect(result.error).toBeUndefined();
    spy.mockRestore();
  });
});
