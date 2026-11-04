import { describe, it, expect } from "vitest";
import { z } from "zod";
import { formatZodError } from "./formatZodError";
import { ValidationError } from "@/lib/errors/ValidationError";

describe("formatZodError", () => {
  it("formats ZodError into ValidationError with field-level details", () => {
    const schema = z.object({
      title: z.string().min(3, "Title must be at least 3 characters"),
      priority: z.enum(["low", "high"], { message: "Invalid priority" }),
    });

    const parsed = schema.safeParse({ title: "a", priority: "invalid" });
    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      const error = formatZodError(parsed.error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.fieldErrors?.title).toBeDefined();
      expect(error.fieldErrors?.priority).toBeDefined();
    }
  });
});
