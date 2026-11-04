import { describe, it, expect } from "vitest";
import { parseCircularFormData } from "./parseCircularFormData";
import { ValidationError } from "@/lib/errors/ValidationError";

describe("parseCircularFormData", () => {
  it("parses valid circular form data", () => {
    const formData = new FormData();
    formData.append("title", "Important Notice");
    formData.append("body", "Please read this circular carefully.");
    formData.append("priority", "high");
    formData.append("response_type", "approval");

    const result = parseCircularFormData(formData);
    expect(result.title).toBe("Important Notice");
    expect(result.priority).toBe("high");
    expect(result.responseType).toBe("approval");
    expect(result.visibility).toBe("internal");
  });

  it("parses explicit public visibility", () => {
    const formData = new FormData();
    formData.append("title", "Public Announcement");
    formData.append("body", "Open to all students and parents.");
    formData.append("visibility", "public");

    const result = parseCircularFormData(formData);
    expect(result.visibility).toBe("public");
  });

  it("throws ValidationError when title is missing", () => {
    const formData = new FormData();
    formData.append("body", "Body text");

    expect(() => parseCircularFormData(formData)).toThrow(ValidationError);
  });

  it("throws ValidationError when priority is invalid", () => {
    const formData = new FormData();
    formData.append("title", "Title");
    formData.append("body", "Body text");
    formData.append("priority", "unsupported-priority");

    expect(() => parseCircularFormData(formData)).toThrow(ValidationError);
  });
});
