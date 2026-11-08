import { describe, it, expect } from "vitest";
import { ValidationError } from "@/lib/errors/ValidationError";
import { resolveAssignmentDepartment } from "./resolveAssignmentDepartment";

const role = (isSystem: boolean, requiresDepartment: boolean) => ({
  id: "r1",
  isSystem,
  requiresDepartment,
});

describe("resolveAssignmentDepartment", () => {
  it("makes a system role without the flag school-wide", () => {
    expect(resolveAssignmentDepartment(role(true, false), "dept-1")).toBeNull();
    expect(resolveAssignmentDepartment(role(true, false), undefined)).toBeNull();
  });

  it("keeps the department of a flagged role", () => {
    expect(resolveAssignmentDepartment(role(true, true), "dept-1")).toBe("dept-1");
  });

  it("requires a department for a flagged role when one is explicitly missing", () => {
    expect(() => resolveAssignmentDepartment(role(true, true), null)).toThrow(ValidationError);
    expect(() => resolveAssignmentDepartment(role(true, true), "")).toThrow(ValidationError);
  });

  it("leaves the department unchanged when none is supplied", () => {
    expect(resolveAssignmentDepartment(role(true, true), undefined)).toBeUndefined();
  });

  it("lets a custom role carry the department it is given", () => {
    expect(resolveAssignmentDepartment(role(false, false), "dept-2")).toBe("dept-2");
    expect(resolveAssignmentDepartment(role(false, false), null)).toBeNull();
  });
});
