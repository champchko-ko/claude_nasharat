"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { PaletteIcon, CheckIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PORTAL_THEMES } from "./themeList";
import { useMounted } from "./useMounted";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const t = useTranslations("theme");

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={t("selectTheme")}
        className="size-9 rounded-md border border-border bg-background"
      />
    );
  }

  const activeTheme = theme ?? "moe";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={t("selectTheme")}
        className="flex size-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-accent focus:outline-hidden"
      >
        <PaletteIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("selectTheme")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PORTAL_THEMES.map((item) => {
          const isSelected = activeTheme === item.id;
          return (
            <DropdownMenuItem
              key={item.id}
              onClick={() => setTheme(item.id)}
              className="flex cursor-pointer items-center gap-2.5 py-1.5"
            >
              <span className="flex items-center -space-x-1 rtl:space-x-reverse">
                <span
                  className="size-3.5 rounded-full shadow-2xs ring-1 ring-border"
                  style={{ backgroundColor: item.sidebarColor }}
                />
                <span
                  className="size-3.5 rounded-full shadow-2xs ring-1 ring-border"
                  style={{ backgroundColor: item.primaryColor }}
                />
                <span
                  className="size-3.5 rounded-full shadow-2xs ring-1 ring-border"
                  style={{ backgroundColor: item.canvasColor }}
                />
              </span>
              <span className="flex-1 truncate text-xs font-medium">{t(item.labelKey)}</span>
              {isSelected ? <CheckIcon className="size-3.5 text-primary" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
