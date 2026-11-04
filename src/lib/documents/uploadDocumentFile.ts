import type { SupabaseClient } from "@supabase/supabase-js";
import { validateStorageUpload } from "@/lib/storage/validateStorageUpload";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function uploadDocumentFile(
  supabase: SupabaseClient,
  file: File,
  schoolId: string,
  slug: string,
): Promise<{ path: string; error: null } | { path: null; error: string }> {
  const validation = await validateStorageUpload(file, {
    allowedMime: ALLOWED_MIME,
    maxBytes: MAX_BYTES,
    invalidFormatMessage: "Invalid file format. Allowed: PDF, JPEG, PNG, WebP",
    tooLargeMessage: "File exceeds the 20MB limit",
    contentMismatchMessage: "File content does not match its declared type",
  });

  if (!validation.ok) {
    return { path: null, error: validation.error };
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${schoolId}/${slug}/${Date.now()}_${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from("school-documents")
    .upload(storagePath, validation.bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { path: null, error: uploadError.message };
  }

  return { path: storagePath, error: null };
}
