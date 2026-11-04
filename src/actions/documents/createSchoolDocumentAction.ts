"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { assertCanManageDocuments } from "@/lib/documents/assertCanManageDocuments";
import { uploadDocumentFile } from "@/lib/documents/uploadDocumentFile";
import { parseDocumentCreateFormData } from "@/lib/documents/parseDocumentCreateFormData";
import { insertSchoolDocumentRecord } from "@/lib/documents/insertSchoolDocumentRecord";
import { getActorDetails } from "@/lib/documents/getActorDetails";
import { ValidationError } from "@/lib/errors/ValidationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function createSchoolDocumentAction(
  formData: FormData,
): Promise<ActionResult<{ documentId: string }>> {
  try {
    const auth = await assertCanManageDocuments();
    if (!auth.allowed || !auth.schoolId) {
      throw new ForbiddenError("Unauthorized to manage school documents");
    }

    const { slug, title, description, file } = parseDocumentCreateFormData(formData);
    const admin = createSupabaseAdminClient(getActorDetails(auth.profile));

    const uploadRes = await uploadDocumentFile(admin, file, auth.schoolId, slug);
    if (uploadRes.error || !uploadRes.path) {
      throw new ValidationError(uploadRes.error || "File upload failed");
    }

    const documentId = await insertSchoolDocumentRecord(admin, {
      schoolId: auth.schoolId,
      slug,
      title,
      description,
      filePath: uploadRes.path,
      file,
      profileId: auth.profile?.id,
    });

    revalidatePath(`/[locale]/documents/${slug}`, "page");
    revalidatePath(`/ar/documents/${slug}`, "page");
    revalidatePath(`/en/documents/${slug}`, "page");
    revalidatePath("/[locale]", "page");
    revalidatePath("/ar", "page");
    revalidatePath("/en", "page");
    revalidatePath("/", "page");

    return { success: true, documentId };
  } catch (error) {
    const sanitized = sanitizeError(error);
    return formatActionErrorResult(sanitized);
  }
}
