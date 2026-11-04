import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadCircularDocument } from "./uploadCircularDocument";

export async function handleCircularDocumentsUpload(
  supabase: SupabaseClient,
  params: {
    formData: FormData;
    schoolId: string;
    circularId: string;
    uploadedBy: string;
  },
): Promise<{ error?: string }> {
  const files = params.formData.getAll("documents");
  for (const item of files) {
    if (item instanceof File && item.size > 0 && item.name) {
      const res = await uploadCircularDocument(supabase, {
        file: item,
        schoolId: params.schoolId,
        circularId: params.circularId,
        uploadedBy: params.uploadedBy,
      });
      if (res.error) {
        return { error: `${item.name}: ${res.error}` };
      }
    }
  }
  return {};
}
