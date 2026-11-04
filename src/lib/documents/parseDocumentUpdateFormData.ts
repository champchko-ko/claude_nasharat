import { ValidationError } from "@/lib/errors/ValidationError";

export interface ParsedDocumentUpdateData {
  id: string;
  title: string;
  description: string | null;
  file: File | null;
}

export function parseDocumentUpdateFormData(formData: FormData): ParsedDocumentUpdateData {
  const id = formData.get("id") as string;
  if (!id) {
    throw new ValidationError("Document ID is required");
  }

  const title = (formData.get("title") as string)?.trim();
  if (!title) {
    throw new ValidationError("Document title is required");
  }

  const description = (formData.get("description") as string)?.trim() || null;
  const rawFile = formData.get("file") as File | null;
  const file = rawFile && rawFile.size > 0 ? rawFile : null;

  return { id, title, description, file };
}
