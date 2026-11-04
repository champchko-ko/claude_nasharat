export type SchoolDocumentSlug = "operational-plan" | "committees-guide" | "counseling-guide";

export interface SchoolDocumentRow {
  id: string;
  school_id: string;
  slug: SchoolDocumentSlug;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  is_published?: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  file_url?: string;
  creator?: {
    id: string;
    full_name: string;
  } | null;
}
