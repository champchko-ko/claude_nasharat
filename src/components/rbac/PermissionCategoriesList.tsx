"use client";

import { useTranslations } from "next-intl";
import { PermissionCheckboxGroup } from "./PermissionCheckboxGroup";

const CATEGORIES = [
  { key: "circulars", titleKey: "categoryCirculars" },
  { key: "maintenance", titleKey: "categoryMaintenance" },
  { key: "calendar", titleKey: "categoryCalendar" },
  { key: "settings", titleKey: "categorySettings" },
  { key: "administration", titleKey: "categoryAdmin" },
  { key: "reporting", titleKey: "categoryReports" },
  { key: "audit", titleKey: "categoryAudit" },
] as const;

export function PermissionCategoriesList({
  selectedKeys,
  onToggle,
  disabled = false,
}: {
  selectedKeys: Set<string>;
  onToggle: (key: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("rbac");

  return (
    <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
      {CATEGORIES.map((cat) => (
        <PermissionCheckboxGroup
          key={cat.key}
          category={cat.key}
          categoryTitle={t(cat.titleKey)}
          selectedKeys={selectedKeys}
          onToggle={onToggle}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
