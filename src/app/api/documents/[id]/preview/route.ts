import { createSupabaseAdminClient } from "@/lib/supabase";
import { assertCanManageDocuments } from "@/lib/documents/assertCanManageDocuments";
import { canPreviewManagedDocument } from "@/lib/documents/canPreviewManagedDocument";
import { getActorDetails } from "@/lib/documents/getActorDetails";
import { isPublicDocumentPreviewAllowed } from "@/lib/documents/isPublicDocumentPreviewAllowed";
import { fetchPreviewDocument } from "@/lib/documents/fetchPreviewDocument";
import { getFirstActiveSchoolId } from "@/lib/school/getFirstActiveSchoolId";
import { NotFoundError, withApiErrorHandler } from "@/lib/errors";

async function handleDocumentPreview(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const access = await assertCanManageDocuments();
  const { id } = await params;
  const admin = createSupabaseAdminClient(getActorDetails(access.profile));

  const doc = await fetchPreviewDocument(admin, id);
  if (!doc) {
    throw new NotFoundError("Document not found");
  }

  const schoolId = access.schoolId ?? (await getFirstActiveSchoolId());
  if (!canPreviewManagedDocument(access, "singleton")) {
    const isPublicAllowed = await isPublicDocumentPreviewAllowed(
      admin,
      schoolId ?? "",
      doc.status === "published" && doc.visibility === "public",
    );
    if (!isPublicAllowed) {
      throw new NotFoundError("Document not found");
    }
  }

  // Let the browser talk directly to Storage after authorization. Native PDF
  // viewers (especially on Android) use byte-range requests while rendering;
  // proxying the whole Blob through this route prevents those viewers from
  // loading reliably inside an iframe.
  const { data: signedFile, error: fileError } = await admin.storage
    .from("school-documents")
    .createSignedUrl(doc.file_path, 120);

  if (fileError || !signedFile?.signedUrl) {
    throw new NotFoundError("Document file not found");
  }

  return Response.redirect(signedFile.signedUrl, 307);
}

export const GET = withApiErrorHandler(handleDocumentPreview);
