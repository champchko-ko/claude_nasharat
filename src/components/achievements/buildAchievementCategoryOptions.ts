export type AchievementCategoryOption = {
  key: string;
  label: string;
};

/**
 * Builds localized category filter options for achievements.
 */
export function buildAchievementCategoryOptions(
  t: (key: string) => string,
): AchievementCategoryOption[] {
  return [
    { key: "all", label: t("allCategories") },
    { key: "academic", label: t("categories.academic") },
    { key: "competition", label: t("categories.competition") },
    { key: "scientific", label: t("categories.scientific") },
    { key: "sports", label: t("categories.sports") },
    { key: "community", label: t("categories.community") },
    { key: "other", label: t("categories.other") },
  ];
}
