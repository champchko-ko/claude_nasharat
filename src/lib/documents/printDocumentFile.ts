import { printAttachment } from "@/lib/circulars/printAttachment";

export async function printDocumentFile(url?: string): Promise<void> {
  return printAttachment(url);
}
