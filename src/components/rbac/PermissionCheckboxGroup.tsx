"use client";

import { useLocale } from "next-intl";
import { Label } from "@/components/ui/label";
import { PERMISSION_CATALOG, type PermissionCatalogItem } from "@/lib/rbac/permissionCatalog";

export function PermissionCheckboxGroup({
  category,
  categoryTitle,
  selectedKeys,
  onToggle,
  disabled = false,
}: {
  category: PermissionCatalogItem["category"];
  categoryTitle: string;
  selectedKeys: Set<string>;
  onToggle: (key: string) => void;
  disabled?: boolean;
}) {
  const locale = useLocale();
  const perms = PERMISSION_CATALOG.filter((p) => p.category === category);

  if (perms.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {categoryTitle}
      </span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {perms.map((p) => {
          const isChecked = selectedKeys.has(p.key);
          const label = locale === "ar" ? p.name_ar : p.name_en;
          return (
            <div key={p.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`perm_${p.key}`}
                checked={isChecked}
                onChange={() => onToggle(p.key)}
                disabled={disabled}
                className="size-4 cursor-pointer rounded border-border text-primary accent-primary focus:ring-primary focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Label
                htmlFor={`perm_${p.key}`}
                className="cursor-pointer text-xs font-normal text-foreground"
              >
                {label}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
