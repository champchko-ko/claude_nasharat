import type { ManageDocumentsAccessResult } from "./assertCanManageDocuments";

export function canPreviewManagedDocument(
  access: ManageDocumentsAccessResult,
  schoolId: string,
): boolean {
  return access.allowed && access.schoolId === schoolId && Boolean(access.profile);
}
