import { describe, it, expect } from "vitest";
import { parseLocationFormData } from "./parseLocationFormData";
import { ValidationError } from "@/lib/errors/ValidationError";

describe("parseLocationFormData", () => {
  it("parses valid location form data", () => {
    const formData = new FormData();
    formData.append("building", "Main Building");
    formData.append("floor", "2");
    formData.append("room", "204");
    formData.append("kind", "lab");

    const parsed = parseLocationFormData(formData);
    expect(parsed.building).toBe("Main Building");
    expect(parsed.floor).toBe("2");
    expect(parsed.room).toBe("204");
    expect(parsed.kind).toBe("lab");
  });

  it("throws ValidationError when building is missing", () => {
    const formData = new FormData();
    formData.append("room", "101");

    expect(() => parseLocationFormData(formData)).toThrow(ValidationError);
  });

  it("throws ValidationError when kind is invalid", () => {
    const formData = new FormData();
    formData.append("building", "Building A");
    formData.append("kind", "unsupported-kind");

    expect(() => parseLocationFormData(formData)).toThrow(ValidationError);
  });
});
