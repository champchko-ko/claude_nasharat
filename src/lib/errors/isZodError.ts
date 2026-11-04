import { ZodError } from "zod";

export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}
