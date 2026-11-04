import { describe, it, expect } from "vitest";
import { buildSettingsTabs } from "./buildSettingsTabs";

describe("buildSettingsTabs", () => {
  const fakeT = (key: string) => `trans_${key}`;

  it("builds all standard tabs when flags are enabled", () => {
    const tabs = buildSettingsTabs(fakeT, {
      canManageSchool: true,
      canManageUsers: true,
      canViewAudit: true,
      canBackupRestore: false,
    });

    const hrefs = tabs.map((t) => t.href);
    expect(hrefs).toContain("/settings/school");
    expect(hrefs).toContain("/settings/departments");
    expect(hrefs).toContain("/settings/locations");
    expect(hrefs).toContain("/settings/users");
    expect(hrefs).toContain("/settings/audit");
    expect(hrefs).not.toContain("/settings/backup");
  });

  it("includes /settings/backup tab when canBackupRestore is true", () => {
    const tabs = buildSettingsTabs(fakeT, {
      canManageSchool: false,
      canManageUsers: false,
      canViewAudit: false,
      canBackupRestore: true,
    });

    expect(tabs).toHaveLength(1);
    expect(tabs[0].href).toBe("/settings/backup");
    expect(tabs[0].label).toBe("trans_backup");
  });
});
