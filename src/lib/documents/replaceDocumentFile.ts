import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadDocumentFile } from "./uploadDocumentFile";
import { ValidationError } from "@/lib/errors/ValidationError";

export interface FileReplacementResult {
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

export async function replaceDocumentFile(
  supabase: SupabaseClient,
  file: File,
  schoolId: string,
  slug: string,
  oldFilePath?: string | null,
): Promise<FileReplacementResult> {
  const uploadRes = await uploadDocumentFile(supabase, file, schoolId, slug);
  if (uploadRes.error || !uploadRes.path) {
    throw new ValidationError(uploadRes.error || "File upload failed");
  }

  if (oldFilePath) {
    await supabase.storage.from("school-documents").remove([oldFilePath]);
  }

  return {
    file_path: uploadRes.path,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
  };
}
