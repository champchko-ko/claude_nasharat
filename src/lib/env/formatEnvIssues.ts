import type { ZodError } from "zod";

export function formatEnvIssues(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
}
