export function formatAttachmentFileName(path: string): string {
  const base = path.split("/").pop() ?? "document";
  const withoutPrefix = base.replace(/^\d+_/, "");
  return withoutPrefix.replace(/_\d+$/, "");
}
