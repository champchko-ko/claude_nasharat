import type { UploadRules } from "@/lib/storage/validateStorageUpload";

/**
 * The acceptance rules for `circular-attachments`. Kept in one place because
 * both the uploader and the circular actions validate against them.
 */
export const circularDocumentRules: UploadRules = {
  allowedMime: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  maxBytes: 10 * 1024 * 1024,
  invalidFormatMessage: "Invalid document format. Only PDF, JPG, PNG, and WebP are allowed.",
  tooLargeMessage: "File exceeds 10MB limit.",
  contentMismatchMessage: "File content does not match its declared type.",
};
