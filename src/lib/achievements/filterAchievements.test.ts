import { describe, expect, it } from "vitest";
import { filterAchievements } from "./filterAchievements";
import type { SchoolAchievementRow } from "./types";

describe("filterAchievements", () => {
  const dummy: SchoolAchievementRow[] = [
    {
      id: "1",
      department_id: "d1",
      title_ar: "المركز الأول في الروبوت",
      title_en: "First place robotics",
      description: "مسابقة وطنية للروبوت والذكاء الاصطناعي",
      category: "competition",
      date_achieved: "2026-04-10",
      visibility: "public",
      image_path: null,
      created_by: "u1",
      created_at: "2026-04-10T00:00:00Z",
      updated_at: "2026-04-10T00:00:00Z",
    },
    {
      id: "2",
      department_id: "d2",
      title_ar: "تفوق دراسي في الفيزياء",
      title_en: "Physics excellence",
      description: "تكريم الطلاب المتفوقين",
      category: "academic",
      date_achieved: "2026-05-01",
      visibility: "internal",
      image_path: null,
      created_by: "u2",
      created_at: "2026-05-01T00:00:00Z",
      updated_at: "2026-05-01T00:00:00Z",
    },
  ];

  it("returns all achievements when filters are default", () => {
    const res = filterAchievements(dummy, {});
    expect(res).toHaveLength(2);
  });

  it("filters by category", () => {
    const res = filterAchievements(dummy, { category: "competition" });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("1");
  });

  it("filters by departmentId", () => {
    const res = filterAchievements(dummy, { departmentId: "d2" });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("2");
  });

  it("filters by search query matching Arabic or English or description", () => {
    const resAr = filterAchievements(dummy, { query: "روبوت" });
    expect(resAr).toHaveLength(1);

    const resEn = filterAchievements(dummy, { query: "robotics" });
    expect(resEn).toHaveLength(1);

    const resDesc = filterAchievements(dummy, { query: "تكريم" });
    expect(resDesc).toHaveLength(1);
    expect(resDesc[0].id).toBe("2");
  });
});
