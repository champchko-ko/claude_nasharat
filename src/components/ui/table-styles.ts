/** Shared look for data tables: navy header row, panel-tinted hover rows. */
export const TABLE_WRAP =
  "overflow-hidden rounded-xl border border-border bg-card shadow-[0_12px_30px_rgba(20,37,74,.10)]";

export const TABLE_HEAD_ROW =
  "border-b-0 bg-[linear-gradient(90deg,var(--topbar-from,var(--sidebar)),var(--topbar-to,var(--sidebar)))] hover:bg-transparent [&_th]:h-11 [&_th]:px-3 [&_th]:font-bold [&_th]:text-sidebar-foreground";

export const TABLE_BODY_ROW =
  "transition-colors hover:bg-[color:var(--panel,var(--muted))] [&>td]:px-3 [&>td]:py-3";

export const EMPTY_PANEL =
  "rounded-2xl border border-dashed border-border bg-[color:var(--panel,var(--card))] p-8 text-center text-sm text-muted-foreground";
