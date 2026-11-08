import { describe, it, expect } from "vitest";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { validateCreateRoleInput } from "./validateCreateRoleInput";

describe("validateCreateRoleInput", () => {
  it("trims the name and normalises the key", () => {
    expect(validateCreateRoleInput("  Lab Assistant ", " Lab-Assistant 2 ")).toEqual({
      trimmedName: "Lab Assistant",
      trimmedKey: "lab_assistant_2",
    });
  });

  it("requires a name and a key", () => {
    expect(() => validateCreateRoleInput("", "key")).toThrow(ValidationError);
    expect(() => validateCreateRoleInput("Name", "  ")).toThrow(ValidationError);
  });

  it("reserves the owner keys", () => {
    expect(() => validateCreateRoleInput("Owner", "owner")).toThrow(ForbiddenError);
    expect(() => validateCreateRoleInput("Owner", "Platform_Owner")).toThrow(ForbiddenError);
  });

  it("rejects keys the database would refuse", () => {
    expect(() => validateCreateRoleInput("Name", "1abc")).toThrow(ValidationError);
    expect(() => validateCreateRoleInput("Name", "a")).toThrow(ValidationError);
    expect(() => validateCreateRoleInput("Name", "x".repeat(64))).toThrow(ValidationError);
  });
});
