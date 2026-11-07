import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PERMISSION_CATALOG } from "./permissionCatalog";
import { PERMISSION_KEYS } from "./permissions";

// The database seeds the permission catalogue (key, category, Arabic and English
// labels). The code keeps a typed copy for the screens. This test is the drift guard.
const seedSql = readFileSync(
  join(process.cwd(), "supabase/migrations/0009_seed_baseline.sql"),
  "utf8",
);

const seeded = [
  ...seedSql.matchAll(/\('([a-z._]+)',\s*'([a-z]+)',\s*'([^']+)',\s*'([^']+)',\s*\d+\)/g),
].map((m) => ({ key: m[1], category: m[2], name_ar: m[3], name_en: m[4] }));

describe("permission catalogue drift guard", () => {
  it("finds the seeded permissions", () => {
    expect(seeded.length).toBeGreaterThan(0);
  });

  it("PERMISSION_KEYS matches the seeded keys exactly", () => {
    expect([...PERMISSION_KEYS].sort()).toEqual(seeded.map((s) => s.key).sort());
  });

  it("PERMISSION_CATALOG matches the seeded categories and labels", () => {
    const byKey = (a: { key: string }, b: { key: string }) => a.key.localeCompare(b.key);
    const catalog = PERMISSION_CATALOG.map(({ key, category, name_ar, name_en }) => ({
      key,
      category,
      name_ar,
      name_en,
    })).sort(byKey);
    expect(catalog).toEqual([...seeded].sort(byKey));
  });
});
