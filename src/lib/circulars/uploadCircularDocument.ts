import type { SupabaseClient } from "@supabase/supabase-js";
import { validateStorageUpload } from "@/lib/storage/validateStorageUpload";
import { circularDocumentRules } from "./circularDocumentRules";
import { insertCircularAttachment } from "./insertCircularAttachment";

export async function uploadCircularDocument(
  supabase: SupabaseClient,
  params: {
    file: File;
    schoolId: string;
    circularId: string;
    uploadedBy: string;
  },
): Promise<{ error?: string }> {
  const validation = await validateStorageUpload(params.file, circularDocumentRules);
  if (!validation.ok) {
    return { error: validation.error };
  }

  const cleanName = params.file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `${params.schoolId}/${params.circularId}/${Date.now()}_${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from("circular-attachments")
    .upload(storagePath, validation.bytes, {
      contentType: params.file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  return insertCircularAttachment(supabase, {
    circularId: params.circularId,
    schoolId: params.schoolId,
    path: storagePath,
    mime: params.file.type,
    sizeBytes: params.file.size,
    uploadedBy: params.uploadedBy,
  });
}
