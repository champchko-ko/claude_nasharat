import { maintenancePhotoRules } from "./maintenancePhotoRules";
import { validateStorageUpload } from "@/lib/storage/validateStorageUpload";
import { ValidationError } from "@/lib/errors/ValidationError";

/**
 * Rejects an invalid report photo before the ticket is written.
 *
 * `createMaintenanceAction` uploads the photo after the ticket row exists (the
 * storage path contains the ticket id), and tickets have no DELETE policy, so
 * a rejection afterwards could not be rolled back. The same rules the uploader
 * enforces are applied up front.
 */
export async function assertValidMaintenancePhoto(photo: File | null): Promise<void> {
  if (!photo || photo.size === 0) return;

  const result = await validateStorageUpload(photo, maintenancePhotoRules);
  if (!result.ok) {
    throw new ValidationError(result.error);
  }
}
