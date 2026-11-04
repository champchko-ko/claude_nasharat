export function getErrorSeverity(statusCode: number): "error" | "warn" | "info" {
  if (statusCode >= 500) return "error";
  if (statusCode >= 400) return "warn";
  return "info";
}
