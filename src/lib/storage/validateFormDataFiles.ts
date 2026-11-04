import { validateClientFile, type ClientFileValidationOptions } from "./validateClientFile";

export function validateFormDataFiles(
  formData: FormData,
  fieldName: string,
  options: ClientFileValidationOptions,
): { valid: boolean; error?: string } {
  const entries = formData.getAll(fieldName);
  for (const entry of entries) {
    if (entry instanceof File && entry.size > 0) {
      const validation = validateClientFile(entry, options);
      if (!validation.valid) {
        return { valid: false, error: `${entry.name}: ${validation.error}` };
      }
    }
  }
  return { valid: true };
}
