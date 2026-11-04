import { describe, it, expect } from "vitest";
import { filterExcludedOwnerRows } from "./filterExcludedOwnerRows";

describe("filterExcludedOwnerRows", () => {
  const ownerUserIds = new Set(["owner-1"]);

  it("filters out owner role from roles table", () => {
    const roles = [
      { id: "r1", key: "owner" },
      { id: "r2", key: "school_admin" },
    ];
    const res = filterExcludedOwnerRows("roles", roles);
    expect(res).toHaveLength(1);
    expect(res[0].key).toBe("school_admin");
  });

  it("filters out owner profiles from profiles table", () => {
    const profiles = [
      { id: "owner-1", full_name: "Owner" },
      { id: "user-2", full_name: "Staff" },
    ];
    const res = filterExcludedOwnerRows("profiles", profiles, ownerUserIds);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("user-2");
  });

  it("filters out owner assignments from user_role_assignments table", () => {
    const assignments = [
      { id: "a1", user_id: "owner-1" },
      { id: "a2", user_id: "user-2" },
    ];
    const res = filterExcludedOwnerRows("user_role_assignments", assignments, ownerUserIds);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("a2");
  });

  it("returns unchanged rows for other tables", () => {
    const circulars = [{ id: "c1", title: "Test" }];
    const res = filterExcludedOwnerRows("circulars", circulars, ownerUserIds);
    expect(res).toEqual(circulars);
  });
});
