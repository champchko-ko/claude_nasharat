import { describe, expect, it } from "vitest";
import { resolveLayoutNavigationAccess } from "./resolveLayoutNavigationAccess";

describe("resolveLayoutNavigationAccess", () => {
  it("grants full access including documents to platform owner", () => {
    const access = resolveLayoutNavigationAccess(true, [], true);

    expect(access.canViewReports).toBe(true);
    expect(access.canManageSettings).toBe(true);
    expect(access.canViewDocuments).toBe(true);
  });

  it("grants documents access to managers with settings or user management permissions", () => {
    const access = resolveLayoutNavigationAccess(false, ["settings.school.update"], true);

    expect(access.canManageSettings).toBe(true);
    expect(access.canViewDocuments).toBe(true);
  });

  it("denies documents access to standard staff with no management permissions", () => {
    const access = resolveLayoutNavigationAccess(
      false,
      ["circular.respond", "maintenance.create"],
      true,
    );

    expect(access.canManageSettings).toBe(false);
    expect(access.canViewDocuments).toBe(false);
  });
});
