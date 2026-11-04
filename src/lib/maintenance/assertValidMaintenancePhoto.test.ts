import { describe, it, expect } from "vitest";
import { assertValidMaintenancePhoto } from "./assertValidMaintenancePhoto";
import { ValidationError } from "@/lib/errors/ValidationError";

const JPEG_MAGIC = [0xff, 0xd8, 0xff, 0xe0, 0x00];

describe("assertValidMaintenancePhoto", () => {
  it("resolves without throwing when photo is null", async () => {
    await expect(assertValidMaintenancePhoto(null)).resolves.toBeUndefined();
  });

  it("resolves without throwing when photo size is 0", async () => {
    const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });
    await expect(assertValidMaintenancePhoto(emptyFile)).resolves.toBeUndefined();
  });

  it("throws ValidationError when photo has invalid MIME", async () => {
    const file = new File(["<svg/>"], "test.svg", { type: "image/svg+xml" });
    await expect(assertValidMaintenancePhoto(file)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when photo signature does not match MIME", async () => {
    const file = new File(["fake bytes"], "test.jpg", { type: "image/jpeg" });
    await expect(assertValidMaintenancePhoto(file)).rejects.toThrow(ValidationError);
  });

  it("resolves without throwing when photo is valid", async () => {
    const file = new File([new Uint8Array(JPEG_MAGIC)], "valid.jpg", { type: "image/jpeg" });
    await expect(assertValidMaintenancePhoto(file)).resolves.toBeUndefined();
  });
});
