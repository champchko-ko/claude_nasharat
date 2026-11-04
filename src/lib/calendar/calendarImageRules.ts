import type { UploadRules } from "@/lib/storage/validateStorageUpload";

/**
 * The acceptance rules for calendar event images (and public asset images).
 */
export const calendarImageRules: UploadRules = {
  allowedMime: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 5 * 1024 * 1024,
  invalidFormatMessage: "Invalid image format. Allowed: JPG, PNG, and WebP.",
  tooLargeMessage: "Image exceeds 5MB limit.",
  contentMismatchMessage: "File content does not match its image type.",
};
