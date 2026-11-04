import type { MessageBoxType } from "./types";

export interface MessageBoxTheme {
  borderClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
  buttonClass: string;
  defaultTitleKey: string;
}

export function getMessageBoxTheme(type: MessageBoxType): MessageBoxTheme {
  switch (type) {
    case "error":
      return {
        borderClass: "border-destructive/40 shadow-[0_0_35px_-12px_var(--destructive)]",
        badgeBgClass: "bg-destructive/10 ring-1 ring-destructive/20",
        badgeTextClass: "text-destructive",
        buttonClass:
          "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm focus:ring-destructive/40",
        defaultTitleKey: "error",
      };
    case "warning":
      return {
        borderClass: "border-warning/30 shadow-[0_0_35px_-12px_var(--warning)]",
        badgeBgClass: "bg-warning/10 ring-1 ring-warning/20",
        badgeTextClass: "text-warning",
        buttonClass:
          "bg-[linear-gradient(180deg,var(--action-from,#0b63d6)_-40%,var(--action-to,#0a2f7a)_120%)] text-[color:var(--action-foreground,#fff)] shadow-[0_6px_16px_rgba(10,47,122,.25),inset_0_-3px_0_var(--gold,#ffcd35)] focus:ring-2 focus:ring-ring/40",
        defaultTitleKey: "warning",
      };
    case "success":
      return {
        borderClass: "border-primary/40 shadow-[0_0_35px_-12px_var(--primary)]",
        badgeBgClass: "bg-primary/10 ring-1 ring-primary/20",
        badgeTextClass: "text-primary",
        buttonClass:
          "bg-[linear-gradient(180deg,var(--action-from,#0b63d6)_-40%,var(--action-to,#0a2f7a)_120%)] text-[color:var(--action-foreground,#fff)] shadow-[0_6px_16px_rgba(10,47,122,.25),inset_0_-3px_0_var(--gold,#ffcd35)] focus:ring-2 focus:ring-ring/40",
        defaultTitleKey: "success",
      };
    case "info":
    default:
      return {
        borderClass: "border-primary/40 shadow-[0_0_35px_-12px_var(--primary)]",
        badgeBgClass: "bg-primary/10 ring-1 ring-primary/20",
        badgeTextClass: "text-primary",
        buttonClass:
          "bg-[linear-gradient(180deg,var(--action-from,#0b63d6)_-40%,var(--action-to,#0a2f7a)_120%)] text-[color:var(--action-foreground,#fff)] shadow-[0_6px_16px_rgba(10,47,122,.25),inset_0_-3px_0_var(--gold,#ffcd35)] focus:ring-2 focus:ring-ring/40",
        defaultTitleKey: "notice",
      };
  }
}
