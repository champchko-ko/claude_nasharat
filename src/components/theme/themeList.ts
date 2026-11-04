export interface PortalThemeItem {
  readonly id: string;
  readonly labelKey: "moe" | "alNada" | "light" | "dark" | "emerald" | "midnight";
  readonly sidebarColor: string;
  readonly primaryColor: string;
  readonly canvasColor: string;
}

export const PORTAL_THEMES: readonly PortalThemeItem[] = [
  {
    id: "moe",
    labelKey: "moe",
    sidebarColor: "#14254a",
    primaryColor: "#ffcd35",
    canvasColor: "#ffffff",
  },
  {
    id: "al-nada",
    labelKey: "alNada",
    sidebarColor: "#0b2246",
    primaryColor: "#1d4ed8",
    canvasColor: "#f4f7fc",
  },
  {
    id: "light",
    labelKey: "light",
    sidebarColor: "#ffffff",
    primaryColor: "#0f172a",
    canvasColor: "#ffffff",
  },
  {
    id: "dark",
    labelKey: "dark",
    sidebarColor: "#18181b",
    primaryColor: "#60a5fa",
    canvasColor: "#09090b",
  },
  {
    id: "emerald",
    labelKey: "emerald",
    sidebarColor: "#064e3b",
    primaryColor: "#10b981",
    canvasColor: "#f6fbf7",
  },
  {
    id: "midnight",
    labelKey: "midnight",
    sidebarColor: "#050811",
    primaryColor: "#06b6d4",
    canvasColor: "#020617",
  },
];
