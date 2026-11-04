import { describe, it, expect } from "vitest";
import { AppError } from "./AppError";
import { isAppError } from "./isAppError";
import { ValidationError } from "./ValidationError";
import { AuthenticationError } from "./AuthenticationError";
import { ForbiddenError } from "./ForbiddenError";
import { NotFoundError } from "./NotFoundError";
import { ConflictError } from "./ConflictError";
import { RateLimitError } from "./RateLimitError";
import { DatabaseError } from "./DatabaseError";
import { NetworkError } from "./NetworkError";
import { ERROR_CODES } from "./errorCodes";

describe("AppError and subclasses", () => {
  it("initializes base AppError with correct defaults", () => {
    const err = new AppError("Something failed");
    expect(err.message).toBe("Something failed");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(err.isOperational).toBe(true);
    expect(isAppError(err)).toBe(true);
  });

  it("identifies non-AppErrors via isAppError", () => {
    expect(isAppError(new Error("standard"))).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError("error")).toBe(false);
  });

  it("creates ValidationError with 422 and field details", () => {
    const fields = { email: ["Invalid email"] };
    const err = new ValidationError("Invalid input", fields, "corr_123");
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe(ERROR_CODES.VALIDATION_FAILED);
    expect(err.fieldErrors).toEqual(fields);
    expect(err.correlationId).toBe("corr_123");
  });

  it("creates AuthenticationError with 401", () => {
    const err = new AuthenticationError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it("creates ForbiddenError with 403", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("creates NotFoundError with 404", () => {
    const err = new NotFoundError("User missing");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it("creates ConflictError with 409", () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe(ERROR_CODES.CONFLICT);
  });

  it("creates RateLimitError with 429", () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe(ERROR_CODES.RATE_LIMITED);
  });

  it("creates DatabaseError with 500", () => {
    const err = new DatabaseError("DB fault");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe(ERROR_CODES.DATABASE_ERROR);
  });

  it("creates NetworkError with 503", () => {
    const err = new NetworkError("Service down");
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe(ERROR_CODES.NETWORK_ERROR);
  });
});
