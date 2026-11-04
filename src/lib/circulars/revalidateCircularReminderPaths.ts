import { revalidatePath } from "next/cache";

export function revalidateCircularReminderPaths(circularId?: string | null): void {
  revalidatePath("/[locale]/circulars", "page");
  if (circularId) {
    revalidatePath(`/[locale]/circulars/${circularId}`, "page");
  }
  revalidatePath("/[locale]/dashboard", "page");
}
