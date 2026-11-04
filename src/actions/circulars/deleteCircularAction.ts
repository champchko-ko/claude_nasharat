"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";
import { deleteCircularRecord } from "@/lib/circulars/deleteCircularRecord";
import { assertCanManageCirculars } from "@/lib/circulars/assertCanManageCirculars";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function deleteCircularAction(circularId: string): Promise<ActionResult> {
  try {
    const auth = await assertCanManageCirculars();
    if (!auth.authorized) {
      throw new ForbiddenError(auth.error || "Unauthorized");
    }

    const supabase = auth.isOwner
      ? createSupabaseAdminClient({ actorId: auth.profileId })
      : await createSupabaseServerClient();
    const res = await deleteCircularRecord(supabase, circularId);
    if (!res.success) {
      throw mapDatabaseError(res.error, "Failed to delete circular");
    }

    revalidatePath("/[locale]/circulars", "page");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
