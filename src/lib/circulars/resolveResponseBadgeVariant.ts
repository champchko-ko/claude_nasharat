export function resolveResponseBadgeVariant(
  status?: string,
): "default" | "destructive" | "secondary" {
  if (status === "approved" || status === "completed") {
    return "default";
  }
  if (status === "rejected") {
    return "destructive";
  }
  return "secondary";
}
