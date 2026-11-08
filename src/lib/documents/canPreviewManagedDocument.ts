import type { ManageDocumentsAccessResult } from "./assertCanManageDocuments";

export function canPreviewManagedDocument(
  access: ManageDocumentsAccessResult,
  legacyScope: string,
): boolean {
  // The application has one school. Keep the second argument for older
  // callers, but do not compare it with the database UUID: that comparison
  // would make every authorized preview fail after the singleton migration.
  void legacyScope;
  return access.allowed && Boolean(access.profile);
}
