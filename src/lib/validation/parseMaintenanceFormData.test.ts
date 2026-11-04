import { describe, it, expect } from "vitest";
import { parseMaintenanceFormData } from "./parseMaintenanceFormData";
import { ValidationError } from "@/lib/errors/ValidationError";

describe("parseMaintenanceFormData", () => {
  it("parses valid maintenance form data", () => {
    const formData = new FormData();
    formData.append("title", "Broken Light");
    formData.append("description", "Light fixture flickering in room 101");
    formData.append("category", "electrical");
    formData.append("priority", "urgent");

    const parsed = parseMaintenanceFormData(formData);
    expect(parsed.title).toBe("Broken Light");
    expect(parsed.description).toBe("Light fixture flickering in room 101");
    expect(parsed.category).toBe("electrical");
    expect(parsed.priority).toBe("urgent");
  });

  it("throws ValidationError when title is missing", () => {
    const formData = new FormData();
    formData.append("description", "Description only");

    expect(() => parseMaintenanceFormData(formData)).toThrow(ValidationError);
  });

  it("throws ValidationError when category is invalid", () => {
    const formData = new FormData();
    formData.append("title", "Leak");
    formData.append("description", "Water leak");
    formData.append("category", "invalid-category");

    expect(() => parseMaintenanceFormData(formData)).toThrow(ValidationError);
  });
});
