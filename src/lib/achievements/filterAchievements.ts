import type { SchoolAchievementRow } from "./types";

export function filterAchievements(
  achievements: SchoolAchievementRow[],
  filters: { query?: string; category?: string; departmentId?: string },
): SchoolAchievementRow[] {
  const { query = "", category = "all", departmentId = "all" } = filters;
  const q = query.trim().toLowerCase();

  return achievements.filter((a) => {
    if (category !== "all" && a.category !== category) return false;
    if (departmentId !== "all" && a.department_id !== departmentId) return false;
    if (!q) return true;
    const haystack = `${a.title_ar} ${a.title_en ?? ""} ${a.description ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });
}
