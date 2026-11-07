import { describe, expect, it } from "vitest";
import { resolveRoleDisplayName } from "./resolveRoleDisplayName";

describe("resolveRoleDisplayName", () => {
  const translations: Record<string, string> = {
    roleStaff: "موظف / كادر مدرسي",
    roleDeptHead: "رئيس قسم",
    roleOperator: "فني صيانة",
    roleSchoolAdmin: "مدير مدرسة",
    roleOwner: "مدير النظام",
  };
  const t = (key: string) => translations[key] ?? key;

  it("resolves null and undefined to roleStaff", () => {
    expect(resolveRoleDisplayName(null, t)).toBe("موظف / كادر مدرسي");
    expect(resolveRoleDisplayName(undefined, t)).toBe("موظف / كادر مدرسي");
    expect(resolveRoleDisplayName("", t)).toBe("موظف / كادر مدرسي");
  });

  it("resolves standard system role keys", () => {
    expect(resolveRoleDisplayName("staff", t)).toBe("موظف / كادر مدرسي");
    expect(resolveRoleDisplayName("department_head", t)).toBe("رئيس قسم");
    expect(resolveRoleDisplayName("operator", t)).toBe("فني صيانة");
    expect(resolveRoleDisplayName("school_admin", t)).toBe("مدير مدرسة");
    expect(resolveRoleDisplayName("owner", t)).toBe("مدير النظام");
  });

  it("falls back to fallbackName or key for custom roles", () => {
    expect(resolveRoleDisplayName("custom_coord", t, "Academic Coordinator")).toBe(
      "Academic Coordinator",
    );
    expect(resolveRoleDisplayName("custom_coord", t)).toBe("custom_coord");
  });

  it("treats the retired auditor role like any other custom role", () => {
    expect(resolveRoleDisplayName("auditor", t, "Auditor")).toBe("Auditor");
    expect(resolveRoleDisplayName("auditor", t)).toBe("auditor");
  });
});
