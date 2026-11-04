import { circularDocumentRules } from "./circularDocumentRules";
import { validateStorageUpload } from "@/lib/storage/validateStorageUpload";
import { ValidationError } from "@/lib/errors/ValidationError";

/**
 * Rejects an invalid attachment before the circular is written.
 *
 * The documents are uploaded after the circular row exists (the storage path
 * contains its id). Validating here means a bad file fails the whole action
 * instead of creating a circular whose attachment was silently dropped.
 */
export async function assertValidCircularDocuments(formData: FormData): Promise<void> {
  for (const item of formData.getAll("documents")) {
    if (!(item instanceof File) || item.size === 0 || !item.name) continue;

    const result = await validateStorageUpload(item, circularDocumentRules);
    if (!result.ok) {
      throw new ValidationError(`${item.name}: ${result.error}`);
    }
  }
}
