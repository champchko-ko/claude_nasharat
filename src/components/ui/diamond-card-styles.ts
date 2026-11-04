/**
 * Shared look for the public-page "diamond" cards (services-guide design).
 * Colors come from tokens in globals.css (--action-*, --rule-from, --card-*),
 * so MOE gets the guide's blue/gold and other themes fall back to their palette.
 */
const EASE = "ease-[cubic-bezier(.22,1,.36,1)]";

export const CARD_SHELL_STATIC =
  "group relative flex flex-col items-center overflow-visible rounded-xl border border-border bg-[radial-gradient(circle_at_20%_0%,var(--card-sheen,transparent),transparent_55%),var(--card)] text-center shadow-[0_12px_30px_rgba(20,37,74,.12)]";

export const CARD_SHELL = `group relative flex flex-col items-center overflow-visible rounded-xl border border-border bg-[radial-gradient(circle_at_20%_0%,var(--card-sheen,transparent),transparent_55%),var(--card)] text-center shadow-[0_2px_6px_rgba(20,37,74,.08)] transition-[transform,box-shadow,border-color] duration-[450ms] ${EASE} hover:-translate-y-2 hover:border-primary/45 hover:shadow-[0_22px_40px_rgba(20,37,74,.18)]`;

export const CARD_HERO_PADDING = "px-6 pt-16 pb-7 sm:px-8 sm:pt-[4.5rem] sm:pb-8";

export const CARD_DIAMOND = `absolute -top-11 left-1/2 grid size-[5.25rem] -translate-x-1/2 rotate-45 place-items-center rounded-[14px] bg-[linear-gradient(135deg,var(--action-from,#0b63d6),var(--action-to,#0a2f7a))] text-gold shadow-[0_10px_20px_rgba(10,47,122,.3)] transition-[transform,border-radius,box-shadow] duration-[550ms] ${EASE} group-hover:rotate-[225deg] group-hover:rounded-full group-hover:shadow-[0_14px_28px_rgba(10,47,122,.45)]`;

export const CARD_DIAMOND_ICON = `inline-flex -rotate-45 transition-transform duration-[550ms] ${EASE} group-hover:-rotate-[225deg] group-hover:scale-110 text-gold`;

export const CARD_RULE = `mb-4 h-0.5 w-28 rounded-full bg-[linear-gradient(90deg,var(--rule-from,#b88a2a),var(--action-to,#0a2f7a))] transition-[width] duration-[450ms] ${EASE} group-hover:w-44`;

export const CARD_DIAMOND_SM = `absolute -top-8 left-1/2 grid size-16 -translate-x-1/2 rotate-45 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--action-from,#0b63d6),var(--action-to,#0a2f7a))] text-gold shadow-[0_10px_20px_rgba(10,47,122,.3)] transition-[transform,border-radius,box-shadow] duration-[550ms] ${EASE} group-hover:rotate-[225deg] group-hover:rounded-full group-hover:shadow-[0_14px_28px_rgba(10,47,122,.45)]`;

/** Same small diamond, filled with the solid brand blue instead of the blue→navy gradient. */
export const CARD_DIAMOND_SM_SOLID = `absolute -top-8 left-1/2 grid size-16 -translate-x-1/2 rotate-45 place-items-center rounded-xl bg-[var(--action-from,#0b63d6)] text-gold shadow-[0_10px_20px_rgba(10,47,122,.3)] transition-[transform,border-radius,box-shadow] duration-[550ms] ${EASE} group-hover:rotate-[225deg] group-hover:rounded-full group-hover:shadow-[0_14px_28px_rgba(10,47,122,.45)]`;

export const CARD_FOOTER_BAR = `-mx-5 flex min-h-11 w-[calc(100%+2.5rem)] items-center justify-center gap-2 rounded-b-[11px] bg-[color:var(--card-bar,#e6e9f1)] px-5 py-2.5 text-sm font-bold text-[color:var(--card-bar-foreground,#3d6db8)] transition-colors duration-[400ms] ${EASE} group-hover:bg-[linear-gradient(90deg,var(--action-from,#0b63d6)_-20%,var(--action-to,#0a2f7a)_120%)] group-hover:text-[color:var(--action-foreground,#fff)]`;

/** Light panel that wraps widgets (the guide's .wrap). */
export const PANEL =
  "rounded-2xl border border-border bg-[color:var(--panel,#eef2f7)] shadow-[0_12px_30px_rgba(20,37,74,.10),inset_0_0_0_4px_var(--background)]";

/** List row in the guide's category-button style. */
export const LIST_ROW = `rounded-md border border-border bg-[linear-gradient(135deg,var(--card),var(--muted))] transition-[transform,box-shadow,border-color] duration-300 ${EASE} hover:border-primary/40 hover:shadow-[0_8px_18px_rgba(20,37,74,.12)] hover:ltr:translate-x-1.5 hover:rtl:-translate-x-1.5`;
