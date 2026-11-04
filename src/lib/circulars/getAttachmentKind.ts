export type AttachmentKind = "image" | "pdf" | "document";

export function getAttachmentKind(path: string, mime?: string | null): AttachmentKind {
  const cleanMime = mime?.toLowerCase() ?? "";
  if (cleanMime.startsWith("image/") || /\.(jpe?g|png|webp|gif|svg|bmp)$/i.test(path)) {
    return "image";
  }
  if (cleanMime === "application/pdf" || /\.pdf$/i.test(path)) {
    return "pdf";
  }
  return "document";
}
