export function cleanFormField(val: FormDataEntryValue | null): string | null {
  if (typeof val !== "string") {
    return null;
  }
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}
