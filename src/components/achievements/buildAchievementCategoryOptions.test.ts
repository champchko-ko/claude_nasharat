import { describe, it, expect } from "vitest";
import { buildAchievementCategoryOptions } from "./buildAchievementCategoryOptions";

describe("buildAchievementCategoryOptions", () => {
  it("builds 7 category filter options using translator", () => {
    const t = (k: string) => `trans_${k}`;
    const options = buildAchievementCategoryOptions(t);

    expect(options).toHaveLength(7);
    expect(options[0]).toEqual({ key: "all", label: "trans_allCategories" });
    expect(options[1]).toEqual({ key: "academic", label: "trans_categories.academic" });
  });
});
