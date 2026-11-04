import { getClientEnv } from "@/lib/env";

export function getSchoolLogoUrl(logoPath?: string | null): string | null {
  if (!logoPath) return null;
  const baseUrl = getClientEnv().NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;
  return `${baseUrl}/storage/v1/object/public/public-assets/${logoPath}`;
}
