export interface ClientFileValidationOptions {
  allowedMimes: readonly string[];
  maxBytes: number;
}

export function validateClientFile(
  file: File,
  options: ClientFileValidationOptions,
): { valid: boolean; error?: string } {
  if (file.size > options.maxBytes) {
    const maxMb = Math.round(options.maxBytes / (1024 * 1024));
    return { valid: false, error: `File size exceeds ${maxMb}MB limit.` };
  }

  if (file.type && !options.allowedMimes.includes(file.type)) {
    return { valid: false, error: "Invalid file format." };
  }

  return { valid: true };
}
