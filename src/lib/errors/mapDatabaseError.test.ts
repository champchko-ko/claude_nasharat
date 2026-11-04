import { describe, it, expect } from "vitest";
import { mapDatabaseError } from "./mapDatabaseError";
import { ConflictError } from "./ConflictError";
import { NotFoundError } from "./NotFoundError";
import { ValidationError } from "./ValidationError";
import { ForbiddenError } from "./ForbiddenError";
import { DatabaseError } from "./DatabaseError";

describe("mapDatabaseError", () => {
  it("maps Postgres 23505 unique constraint violation to ConflictError", () => {
    const err = mapDatabaseError({ code: "23505", message: "duplicate key value" }, "corr_1");
    expect(err).toBeInstanceOf(ConflictError);
    expect(err.statusCode).toBe(409);
    expect(err.correlationId).toBe("corr_1");
  });

  it("maps Postgres 23503 foreign key violation to NotFoundError", () => {
    const err = mapDatabaseError({ code: "23503", message: "violates foreign key" }, "corr_2");
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.statusCode).toBe(404);
  });

  it("maps Postgres 23502 not-null violation to ValidationError", () => {
    const err = mapDatabaseError({ code: "23502", message: "null value in column" }, "corr_3");
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.statusCode).toBe(422);
  });

  it("maps Postgres 42501 RLS / permission violation to ForbiddenError", () => {
    const err = mapDatabaseError({ code: "42501", message: "insufficient privilege" }, "corr_4");
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.statusCode).toBe(403);
  });

  it("maps Postgres 22P02 invalid text representation to ValidationError", () => {
    const err = mapDatabaseError(
      { code: "22P02", message: "invalid input syntax for type uuid" },
      "corr_4b",
    );
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.statusCode).toBe(422);
  });

  it("maps Postgres 23514 check constraint violation to ValidationError", () => {
    const err = mapDatabaseError({ code: "23514", message: "fails check constraint" }, "corr_4c");
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.statusCode).toBe(422);
  });

  it("maps PostgREST PGRST116 single row not found to NotFoundError", () => {
    const err = mapDatabaseError({ code: "PGRST116", message: "0 rows" }, "corr_5");
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.statusCode).toBe(404);
  });

  it("maps unknown database errors to DatabaseError with custom fallbackMessage", () => {
    const err = mapDatabaseError("raw error string", "Failed to save record");
    expect(err).toBeInstanceOf(DatabaseError);
    expect(err.message).toBe("Failed to save record");
    expect(err.statusCode).toBe(500);
  });

  it("maps unknown database errors to DatabaseError", () => {
    const err = mapDatabaseError({ code: "XX000", message: "internal error" }, "corr_6");
    expect(err).toBeInstanceOf(DatabaseError);
    expect(err.statusCode).toBe(500);
  });
});
