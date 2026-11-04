import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadCalendarImage } from "./uploadCalendarImage";

const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00];
const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xe0, 0x00];

function makeClient(upload = vi.fn().mockResolvedValue({ error: null })) {
  const client = {
    storage: { from: vi.fn(() => ({ upload })) },
  } as unknown as SupabaseClient;
  return { client, upload };
}

describe("uploadCalendarImage", () => {
  it("rejects SVG banners", async () => {
    const { client, upload } = makeClient();
    const file = new File(["<svg/>"], "banner.svg", { type: "image/svg+xml" });

    const result = await uploadCalendarImage(client, file, "school-1");

    expect(result.path).toBeUndefined();
    expect(result.error).toBe("Invalid image format. Allowed: JPG, PNG, and WebP.");
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects a renamed non-image file", async () => {
    const { client, upload } = makeClient();
    const file = new File(["not really a jpeg"], "banner.jpg", { type: "image/jpeg" });

    const result = await uploadCalendarImage(client, file, "school-1");

    expect(result.error).toBe("File content does not match its image type.");
    expect(upload).not.toHaveBeenCalled();
  });

  it("uploads a real JPEG into the calendar folder", async () => {
    const { client, upload } = makeClient();
    const file = new File([new Uint8Array(JPEG_BYTES)], "banner.jpg", { type: "image/jpeg" });

    const result = await uploadCalendarImage(client, file, "school-1");

    expect(result.error).toBeUndefined();
    expect(result.path).toMatch(/^school-1\/calendar\/\d+_banner\.jpg$/);
    expect(upload).toHaveBeenCalledWith(
      result.path,
      expect.any(Uint8Array),
      expect.objectContaining({ contentType: "image/jpeg", upsert: false }),
    );
  });

  it("rejects images over 5MB", async () => {
    const { client, upload } = makeClient();
    const file = new File([new Uint8Array(PNG_BYTES)], "big.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 6 * 1024 * 1024 });

    const result = await uploadCalendarImage(client, file, "school-1");

    expect(result.error).toBe("Image exceeds 5MB limit.");
    expect(upload).not.toHaveBeenCalled();
  });
});
