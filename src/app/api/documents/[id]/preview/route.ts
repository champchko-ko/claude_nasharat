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

  // Keep the response same-origin. The in-app PDF renderer fetches this URL
  // from JavaScript, so redirecting to the cross-origin signed URL would make
  // the browser enforce Storage CORS before PDF.js can read the document.
  const { data: file, error: fileError } = await admin.storage
    .from("school-documents")
    .download(doc.file_path);

  if (fileError || !file) {
    throw new NotFoundError("Document file not found");
  }

  return new Response(await file.arrayBuffer(), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "Content-Type": file.type || doc.mime_type,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const GET = withApiErrorHandler(handleDocumentPreview);
