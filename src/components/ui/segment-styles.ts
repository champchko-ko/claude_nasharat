/** Segmented toggles and filter chips in the services-guide style. */
const EASE = "ease-[cubic-bezier(.22,1,.36,1)]";

const BASE = `inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap transition-[transform,box-shadow,background-color,border-color,color] duration-300 ${EASE} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`;

const ACTIVE =
  "bg-[linear-gradient(180deg,var(--action-from,#0b63d6)_-40%,var(--action-to,#0a2f7a)_120%)] text-[color:var(--action-foreground,#fff)] shadow-[0_6px_14px_rgba(10,47,122,.3),inset_0_-3px_0_var(--gold,#ffcd35)]";

export const SEGMENT_GROUP =
  "inline-flex items-center gap-1 rounded-xl border border-border bg-[color:var(--panel,var(--muted))] p-1";

export const segmentClass = (active: boolean) =>
  `${BASE} h-9 rounded-lg px-4 text-sm ${
    active
      ? ACTIVE
      : "text-primary hover:-translate-y-0.5 hover:bg-card hover:shadow-[0_6px_14px_rgba(20,37,74,.12)]"
  }`;

export const chipClass = (active: boolean) =>
  `${BASE} h-9 rounded-md border px-3.5 text-sm ${
    active
      ? `border-transparent ${ACTIVE}`
      : "border-border bg-[linear-gradient(135deg,var(--card),var(--muted))] text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_6px_14px_rgba(20,37,74,.12)]"
  }`;
