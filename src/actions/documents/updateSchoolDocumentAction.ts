"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { assertCanManageDocuments } from "@/lib/documents/assertCanManageDocuments";
import { parseDocumentUpdateFormData } from "@/lib/documents/parseDocumentUpdateFormData";
import { replaceDocumentFile } from "@/lib/documents/replaceDocumentFile";
import { findDocumentForSchool } from "@/lib/documents/findDocumentForSchool";
import { getActorDetails } from "@/lib/documents/getActorDetails";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function updateSchoolDocumentAction(
  formData: FormData,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await assertCanManageDocuments();
    if (!auth.allowed || !auth.schoolId) {
      throw new ForbiddenError("Unauthorized to manage school documents");
    }

    const { id, title, description, file } = parseDocumentUpdateFormData(formData);
    const admin = createSupabaseAdminClient(getActorDetails(auth.profile));

    const existing = await findDocumentForSchool(admin, id, auth.schoolId);

    const updatePayload: Record<string, unknown> = {
      title,
      description,
      updated_at: new Date().toISOString(),
    };

    if (file) {
      const fileData = await replaceDocumentFile(
        admin,
        file,
        auth.schoolId,
        existing.slug,
        existing.file_path,
      );
      Object.assign(updatePayload, fileData);
    }

    const { error: updateError } = await admin
      .from("school_documents")
      .update(updatePayload)
      .eq("id", id)
      ;

    if (updateError) {
      throw mapDatabaseError(updateError, "Failed to update document");
    }

    revalidatePath(`/[locale]/documents/${existing.slug}`, "page");
    revalidatePath(`/ar/documents/${existing.slug}`, "page");
    revalidatePath(`/en/documents/${existing.slug}`, "page");
    revalidatePath("/[locale]", "page");
    revalidatePath("/ar", "page");
    revalidatePath("/en", "page");
    revalidatePath("/", "page");

    return { success: true };
  } catch (error) {
    const sanitized = sanitizeError(error);
    return formatActionErrorResult(sanitized);
  }
}
