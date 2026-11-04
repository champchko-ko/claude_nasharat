import type { SupabaseClient } from "@supabase/supabase-js";
import { hasValidFileSignature } from "@/lib/storage/hasValidFileSignature";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

export async function uploadSchoolLogo(
  supabase: SupabaseClient,
  schoolId: string,
  file: File | null | undefined,
): Promise<{ path: string | null; error?: string }> {
  if (!file || file.size === 0 || !file.name) {
    return { path: null };
  }

  // The bucket no longer accepts SVG (0044), but checking here produces a
  // useful error instead of a generic Storage rejection, and the magic-byte
  // check stops a renamed HTML/SVG file from being stored as a PNG (H-18).
  if (!ALLOWED_MIME.includes(file.type)) {
    return { path: null, error: "Invalid image format. Allowed: JPG, PNG, and WebP." };
  }

  if (file.size > MAX_BYTES) {
    return { path: null, error: "Image file size exceeds 2MB" };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidFileSignature(bytes, file.type)) {
    return { path: null, error: "File content does not match its image type." };
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${schoolId}/logo/${Date.now()}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from("public-assets")
    .upload(filePath, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return { path: null, error: uploadError.message };
  }

  return { path: filePath };
}
