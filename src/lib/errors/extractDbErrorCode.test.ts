import { describe, it, expect } from "vitest";
import { extractDbErrorCode } from "./extractDbErrorCode";

describe("extractDbErrorCode", () => {
  it("extracts string code from object containing code property", () => {
    expect(extractDbErrorCode({ code: "23505" })).toBe("23505");
  });

  it("returns undefined when code property is not a string", () => {
    expect(extractDbErrorCode({ code: 12345 })).toBeUndefined();
  });

  it("returns undefined for null, undefined, primitive, or objects without code", () => {
    expect(extractDbErrorCode(null)).toBeUndefined();
    expect(extractDbErrorCode(undefined)).toBeUndefined();
    expect(extractDbErrorCode("string-error")).toBeUndefined();
    expect(extractDbErrorCode(123)).toBeUndefined();
    expect(extractDbErrorCode({})).toBeUndefined();
    expect(extractDbErrorCode({ message: "error without code" })).toBeUndefined();
  });
});
