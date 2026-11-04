import { describe, it, expect } from "vitest";
import { sanitizeError } from "./sanitizeError";
import { NotFoundError } from "./NotFoundError";
import { ERROR_CODES } from "./errorCodes";

describe("sanitizeError", () => {
  it("preserves existing AppError instances", () => {
    const original = new NotFoundError("User missing", "corr_123");
    const sanitized = sanitizeError(original);

    expect(sanitized).toBe(original);
    expect(sanitized.statusCode).toBe(404);
    expect(sanitized.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(sanitized.correlationId).toBe("corr_123");
  });

  it("maps Postgres errors into appropriate AppErrors", () => {
    const pgError = { code: "23505", message: "duplicate key" };
    const sanitized = sanitizeError(pgError, { test: true }, "corr_456");

    expect(sanitized.statusCode).toBe(409);
    expect(sanitized.code).toBe(ERROR_CODES.CONFLICT);
    expect(sanitized.correlationId).toBe("corr_456");
  });

  it("sanitizes unexpected generic errors and produces a correlationId", () => {
    const rawError = new Error("Failed connecting to internal DB host 10.0.0.5");
    const sanitized = sanitizeError(rawError);

    expect(sanitized.statusCode).toBe(500);
    expect(sanitized.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(sanitized.correlationId).toBeDefined();
    expect(sanitized.correlationId?.startsWith("err_")).toBe(true);
  });
});
