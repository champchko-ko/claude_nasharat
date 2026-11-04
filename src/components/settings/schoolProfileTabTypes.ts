import type React from "react";

export type SchoolProfileTabId =
  "identity" | "leadership" | "contact" | "logo" | "operations" | "narrative";

export interface SchoolProfileTabItem {
  id: SchoolProfileTabId;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}
