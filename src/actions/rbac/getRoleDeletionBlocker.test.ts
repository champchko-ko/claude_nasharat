import { describe, it, expect } from "vitest";
import { getRoleDeletionBlocker } from "./getRoleDeletionBlocker";

const custom = { key: "electrician", is_system: false, is_locked: false };

describe("getRoleDeletionBlocker", () => {
  it("allows the owner to delete a custom role", () => {
    expect(getRoleDeletionBlocker(custom, true)).toBeNull();
  });

  it("reports an unknown role", () => {
    expect(getRoleDeletionBlocker(null, true)).toBe("Role not found");
  });

  it("refuses everyone but the owner", () => {
    expect(getRoleDeletionBlocker(custom, false)).toBe("Only the owner can delete roles");
  });

  it("protects the locked owner role", () => {
    const owner = { key: "owner", is_system: true, is_locked: true };
    expect(getRoleDeletionBlocker(owner, true)).toBe("Cannot delete the owner role");
  });

  it("protects a role named owner even if the flags were wrong", () => {
    const odd = { key: "owner", is_system: false, is_locked: false };
    expect(getRoleDeletionBlocker(odd, true)).toBe("Cannot delete the owner role");
  });

  it("protects system roles", () => {
    const system = { key: "operator", is_system: true, is_locked: false };
    expect(getRoleDeletionBlocker(system, true)).toBe("System roles cannot be deleted");
  });
});
