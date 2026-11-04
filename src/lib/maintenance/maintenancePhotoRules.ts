import type { UploadRules } from "@/lib/storage/validateStorageUpload";

/**
 * The acceptance rules for `maintenance-photos`. Kept in one place because
 * both the uploader and `createMaintenanceAction` validate against them.
 */
export const maintenancePhotoRules: UploadRules = {
  allowedMime: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 10 * 1024 * 1024,
  invalidFormatMessage: "Invalid photo format. Only JPG, PNG, and WebP allowed.",
  tooLargeMessage: "Photo exceeds 10MB limit.",
  contentMismatchMessage: "Photo content does not match its declared type.",
};
