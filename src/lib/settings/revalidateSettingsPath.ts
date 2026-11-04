import { revalidatePath } from "next/cache";

/**
 * Revalidates cache across default (Arabic as-needed) and explicit (English /en)
 * localized routes, as well as Next.js route-group filesystem tags.
 */
export function revalidateSettingsPath(subpath?: string): void {
  const pathSuffix = subpath ? `/${subpath}` : "";

  // 1. Revalidate default locale route (Arabic: /settings or /settings/...)
  revalidatePath(`/settings${pathSuffix}`);

  // 2. Revalidate explicit locale route (English: /en/settings or /en/settings/...)
  revalidatePath(`/en/settings${pathSuffix}`);

  // 3. Revalidate internal filesystem page tag
  if (subpath) {
    revalidatePath(`/[locale]/(app)/settings/${subpath}`, "page");
  } else {
    revalidatePath("/[locale]/(app)/settings", "page");
  }

  // 4. Revalidate settings layout tag so shared layout data refreshes
  revalidatePath("/[locale]/(app)/settings", "layout");
}
