import type { z } from "zod";
import { ValidationError } from "@/lib/errors/ValidationError";

export function formatZodError(error: z.ZodError): ValidationError {
  const issues = error.issues;
  const firstMessage = issues[0]?.message || "Validation failed";
  const fieldErrors = error.flatten().fieldErrors;

  return new ValidationError(firstMessage, fieldErrors);
}
