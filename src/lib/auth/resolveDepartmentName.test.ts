import { describe, it, expect } from "vitest";
import { resolveDepartmentName } from "./resolveDepartmentName";
import type { ProfileRow } from "./getCurrentProfile";

describe("resolveDepartmentName", () => {
  it("returns null if profile is null or has no department_id", () => {
    expect(resolveDepartmentName(null)).toBeNull();
    const noDept: ProfileRow = {
      id: "1",
      full_name: "John",
      email: "john@example.com",
      job_title: null,
      school_id: "s1",
      department_id: null,
      is_active: true,
    };
    expect(resolveDepartmentName(noDept)).toBeNull();
  });

  it("resolves Arabic name when locale is ar", () => {
    const profile: ProfileRow = {
      id: "2",
      full_name: "أمال",
      email: "amal@example.com",
      job_title: "رئيس قسم",
      school_id: "s1",
      department_id: "d1",
      department_name_ar: "العلوم والتكنولوجيا",
      department_name_en: "Science & Tech",
      department_name: "العلوم والتكنولوجيا",
      is_active: true,
    };
    expect(resolveDepartmentName(profile, "ar")).toBe("العلوم والتكنولوجيا");
  });

  it("resolves English name when locale is en", () => {
    const profile: ProfileRow = {
      id: "2",
      full_name: "Amal",
      email: "amal@example.com",
      job_title: "Dept Head",
      school_id: "s1",
      department_id: "d1",
      department_name_ar: "العلوم والتكنولوجيا",
      department_name_en: "Science & Tech",
      department_name: "Science & Tech",
      is_active: true,
    };
    expect(resolveDepartmentName(profile, "en")).toBe("Science & Tech");
  });
});
