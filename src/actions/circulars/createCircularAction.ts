"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";
import { parseCircularFormData } from "@/lib/validation/parseCircularFormData";
import { insertCircularTargets } from "@/lib/circulars/insertCircularTargets";
import { createCircularRecord } from "@/lib/circulars/createCircularRecord";
import { handleCircularDocumentsUpload } from "@/lib/circulars/handleCircularDocumentsUpload";
import { assertValidCircularDocuments } from "@/lib/circulars/assertValidCircularDocuments";
import { assertCanManageCirculars } from "@/lib/circulars/assertCanManageCirculars";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { ValidationError } from "@/lib/errors/ValidationError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function createCircularAction(
  formData: FormData,
): Promise<ActionResult<{ circularId: string }>> {
  try {
    const auth = await assertCanManageCirculars();
    if (!auth.authorized) {
      throw new ForbiddenError(auth.error);
    }

    const { title, body, priority, visibility, responseType, dueAt, departmentIds } =
      parseCircularFormData(formData);

    if (!title || !body) {
      throw new ValidationError("Title and content are required");
    }

    await assertValidCircularDocuments(formData);

    const supabase = auth.isOwner
      ? createSupabaseAdminClient({ actorId: auth.profileId })
      : await createSupabaseServerClient();
    const res = await createCircularRecord(supabase, {
      schoolId: auth.schoolId,
      title,
      body,
      priority,
      visibility,
      responseType,
      dueAt,
      createdBy: auth.profileId,
    });

    if (!res.circularId) {
      throw mapDatabaseError(res.error, "Failed to create circular");
    }

    const targetResult = await insertCircularTargets(
      supabase,
      res.circularId,
      auth.schoolId,
      departmentIds,
    );
    if (targetResult.error) {
      // Best-effort rollback: a circular with no audience is worse than a
      // failed creation, and the user must see the failure.
      await supabase.from("circulars").delete().eq("id", res.circularId);
      throw mapDatabaseError(targetResult.error, "Could not save circular targets");
    }

    const uploadRes = await handleCircularDocumentsUpload(supabase, {
      formData,
      schoolId: auth.schoolId,
      circularId: res.circularId,
      uploadedBy: auth.profileId,
    });
    if (uploadRes.error) {
      throw mapDatabaseError(uploadRes.error, "Failed to upload circular documents");
    }

    revalidatePath("/[locale]/circulars", "page");
    return { success: true, circularId: res.circularId };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
