import { ValidationError } from "@/lib/errors/ValidationError";
import type { SchoolDocumentSlug } from "./types";

const VALID_SLUGS: readonly SchoolDocumentSlug[] = [
  "operational-plan",
  "committees-guide",
  "counseling-guide",
];

export interface ParsedDocumentCreateData {
  slug: SchoolDocumentSlug;
  title: string;
  description: string | null;
  file: File;
}

export function parseDocumentCreateFormData(formData: FormData): ParsedDocumentCreateData {
  const slug = formData.get("slug") as SchoolDocumentSlug;
  if (!slug || !VALID_SLUGS.includes(slug)) {
    throw new ValidationError("Invalid document category");
  }

  const title = (formData.get("title") as string)?.trim();
  if (!title) {
    throw new ValidationError("Document title is required");
  }

  const description = (formData.get("description") as string)?.trim() || null;
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    throw new ValidationError("Document file is required");
  }

  return { slug, title, description, file };
}
