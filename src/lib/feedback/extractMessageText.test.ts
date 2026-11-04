import { describe, expect, it } from "vitest";
import { extractMessageText } from "./extractMessageText";

describe("extractMessageText", () => {
  it("returns string as-is", () => {
    expect(extractMessageText("Sample message")).toBe("Sample message");
  });

  it("extracts message property from an object", () => {
    expect(extractMessageText({ message: "Object error message" })).toBe("Object error message");
  });

  it("converts unknown primitives to string", () => {
    expect(extractMessageText(404)).toBe("404");
  });

  it("handles null or undefined gracefully", () => {
    expect(extractMessageText(null)).toBe("");
    expect(extractMessageText(undefined)).toBe("");
  });
});
