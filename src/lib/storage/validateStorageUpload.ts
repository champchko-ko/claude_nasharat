import { hasValidFileSignature } from "./hasValidFileSignature";

export type UploadRules = {
  allowedMime: readonly string[];
  maxBytes: number;
  invalidFormatMessage: string;
  tooLargeMessage: string;
  contentMismatchMessage: string;
};

export type UploadValidation = { ok: true; bytes: Uint8Array } | { ok: false; error: string };

/**
 * Validates an upload before anything is written.
 *
 * Actions call this *before* creating the parent row so a rejected file
 * cannot leave behind a ticket or circular that is missing its attachment.
 * The uploaders call the same function, so the rules cannot drift between the
 * two entry points (H-18).
 */
export async function validateStorageUpload(
  file: File,
  rules: UploadRules,
): Promise<UploadValidation> {
  if (!rules.allowedMime.includes(file.type)) {
    return { ok: false, error: rules.invalidFormatMessage };
  }

  if (file.size > rules.maxBytes) {
    return { ok: false, error: rules.tooLargeMessage };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidFileSignature(bytes, file.type)) {
    return { ok: false, error: rules.contentMismatchMessage };
  }

  return { ok: true, bytes };
}
