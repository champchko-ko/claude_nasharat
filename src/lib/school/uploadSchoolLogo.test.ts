import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadSchoolLogo } from "./uploadSchoolLogo";

const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00];

function makeClient(upload = vi.fn().mockResolvedValue({ error: null })) {
  const client = {
    storage: { from: vi.fn(() => ({ upload })) },
  } as unknown as SupabaseClient;
  return { client, upload };
}

describe("uploadSchoolLogo", () => {
  it("rejects SVG even though the browser can declare it", async () => {
    const { client, upload } = makeClient();
    const file = new File(["<svg onload=alert(1)>"], "logo.svg", { type: "image/svg+xml" });

    const result = await uploadSchoolLogo(client, "school-1", file);

    expect(result.path).toBeNull();
    expect(result.error).toBe("Invalid image format. Allowed: JPG, PNG, and WebP.");
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects a file whose bytes do not match its declared image type", async () => {
    const { client, upload } = makeClient();
    const file = new File(["<svg onload=alert(1)>"], "logo.png", { type: "image/png" });

    const result = await uploadSchoolLogo(client, "school-1", file);

    expect(result.path).toBeNull();
    expect(result.error).toBe("File content does not match its image type.");
    expect(upload).not.toHaveBeenCalled();
  });

  it("uploads a real PNG under the school logo folder", async () => {
    const { client, upload } = makeClient();
    const file = new File([new Uint8Array(PNG_BYTES)], "logo.png", { type: "image/png" });

    const result = await uploadSchoolLogo(client, "school-1", file);

    expect(result.error).toBeUndefined();
    expect(result.path).toMatch(/^school-1\/logo\/\d+-logo\.png$/);
    expect(upload).toHaveBeenCalledWith(
      result.path,
      expect.any(Uint8Array),
      expect.objectContaining({ contentType: "image/png", upsert: true }),
    );
  });

  it("returns no path when no file was selected", async () => {
    const { client, upload } = makeClient();

    const result = await uploadSchoolLogo(client, "school-1", null);

    expect(result).toEqual({ path: null });
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects files larger than 2MB before reading them", async () => {
    const { client, upload } = makeClient();
    const file = new File(["x"], "logo.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 3 * 1024 * 1024 });

    const result = await uploadSchoolLogo(client, "school-1", file);

    expect(result.path).toBeNull();
    expect(result.error).toBe("Image file size exceeds 2MB");
    expect(upload).not.toHaveBeenCalled();
  });
});
