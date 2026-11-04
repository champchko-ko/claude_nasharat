# Read-Only Audit — School_Administration_Portal

**Date:** 30 Oct 2026 · **Scope:** current working tree on `C:\Users\ahmed\Desktop\School_Administration_Portal`
**Mode:** read/inspect only — no files were created, modified, or deleted in the app. `tsc` ran with `--incremental false` (no tsbuildinfo written); ESLint ran without cache; all directory comparisons were list-only.

---

## 0. TL;DR

| Area                        | Verdict                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Hard-coded palette colors   | **0 remaining** — new code is fully token-based                                                                        |
| Hard-coded fonts            | **0** — Tajawal now wired through `next/font` tokens                                                                   |
| i18n parity (en/ar)         | **Perfect** — 711 = 711 keys                                                                                           |
| TypeScript                  | **Clean** (exit 0)                                                                                                     |
| ESLint                      | **FAILS** — 6 errors + 1 warning (4 files exceed the function-size/complexity rules, 1 double-export, 1 unused import) |
| File-size rule (≤300 lines) | **Clean** — no file over 300 lines                                                                                     |
| Runtime (dev server)        | **Healthy** — all audited routes return 200; one transient hydration warning during edits                              |
| Git hygiene                 | **Everything uncommitted** — 159 modified + 10 new files vs HEAD (last commit 29 Oct 07:13)                            |

---

## 1. What changed since the last sync (29 Oct 17:47)

**107 files modified + 10 new, 0 deleted.** Three evening batches (20:30–20:38, 22:14–22:18, 22:38–22:39) plus one edit minutes before the audit (`CreateMaintenanceForm.tsx`, 30 Oct 20:30) — the tree is a moving target; results are a snapshot.

### New files (10)

```
components/auth/AuthShell.tsx            components/ui/diamond-card-styles.ts
components/auth/authStyles.ts            components/ui/gold-dots.tsx
components/public/PublicSectionTitle.tsx  components/ui/page-header.tsx
components/public/PublicTopBar.tsx        components/ui/segment-styles.ts
components/public/publicCardStyles.ts     components/ui/table-styles.ts
```

### Theme system overhaul (the biggest change)

- **MOE promoted to root identity.** `:root` now carries the full MOE palette (navy `#14254a`, gold `#ffcd35` as `--gold`, MOE success/info/scrim, MOE chart hues, gold sidebar accents) plus a new public-page token layer: `--action-from/-to` (blue gradient `#0b63d6→#0a2f7a`), `--rule-from`, `--card-sheen`, `--card-bar`, `--panel`, `--topbar-*`, `--nav-active-*` (globals.css:69–128).
- **All five original themes preserved** (`.al-nada`, `.light`, `.dark`, `.emerald`, `.midnight`) and a clean fallback block remaps every MOE-only token to each theme's own palette (globals.css:182–201). The apparent "duplicate `.midnight`" is this shared selector list — **not** a duplicate definition.
- **`defaultTheme="moe"`** (layout.tsx) and toggle fallback `"moe"`. `themeList.ts` untouched — the MOE entry and swatch are intact; `theme.moe` labels exist in both locales ("MOE Navy & Gold" / "وزارة التربية").
- **Typography switched to Tajawal** (the MOE site's typeface): `next/font` now loads Tajawal 400/500/700/800 for body and 700/800 for headings; **Almarai, Aref Ruqaa and Outfit were removed**; my `--font-latin` self-reference bug was also fixed.
- **New design language for public pages:** `PublicTopBar` (events ticker on navy `--topbar-*` gradient), diamond-icon cards (`diamond-card-styles.ts`), gold-dot ornaments, section-title component, segment buttons, centralized table styles, new hero animations (`heroFadeDown/Up`, `ambientPulse`, `gentleFloat`).
- **Buttons redesigned:** default variant is now the blue action-gradient with lift/brightness hover (button.tsx:11); cards gained a radial sheen + hover-lift treatment (card.tsx:14).

---

## 2. Theme-compliance re-audit ("no hard-coded colors or fonts")

**Passes:**

- Palette classes (`bg-blue-*`, `text-emerald-*`, …): **0 occurrences** in the whole `src` tree — the new components stayed token-clean.
- Hard-coded fonts (`fontFamily`, `font-[...]`): **0**.
- New tokens were added properly via `@theme inline` (`--color-gold`, `--color-action-foreground`, `--color-panel`, `--color-card-bar`, `--color-nav-active-foreground`).
- Select/option compatibility block fully tokenized (`var(--card)`, `var(--card-foreground)`, `var(--primary)`).

**Remaining exceptions (all new code, all low severity):**

| #   | Where                                                                                                                                                                                                     | What                                                                                    | Suggestion                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | `PublicTopBar.tsx:42`, `CalendarMonthView.tsx:15,121`, `NavLink.tsx:47`                                                                                                                                   | 7 glass-effect literals: `border-white/10`, `bg-black/15`, `bg-white/10`, `bg-white/20` | use `bg-scrim/…`, `bg-scrim-foreground/…`, `border-background/…` if strictly token-pure glass is wanted |
| 2   | `table-styles.ts:3`, `segment-styles.ts:7,16,23`, `diamond-card-styles.ts:9,11,15,21,27,30`, `button.tsx:11`, `card.tsx:14`, `PublicEventsSection.tsx:23`, `MaintenanceTimeline.tsx:17`, `NavLink.tsx:37` | Navy-based `rgba(20,37,74,…)` / `rgba(10,47,122,…)` shadows baked into class strings    | brand-consistent; optionally define `--shadow-card` / `--shadow-action` tokens later                    |
| 3   | style modules                                                                                                                                                                                             | `var(--token, #hex)` fallbacks bake hex values                                          | harmless today (fallback block defines all tokens for every theme); keep in mind if tokens get renamed  |

**One real regression — do address:** the alternate themes (`.al-nada`, `.light`, `.dark`, `.emerald`, `.midnight`) no longer override `--success / --warning / --info / --scrim / --chart-*`. They inherit the MOE light-tuned values, so in the two dark themes status text drops below WCAG AA: `--success #28a745` on `#09090b` ≈ **4.0:1**, `--info #0b6eda` on `#09090b` ≈ **3.6:1** (previously these themes used bright `#4ade80` / `#38bdf8` ≈ 8–10:1). Adding three-line overrides in `.dark`/`.midnight` restores this.

---

## 3. Code health

**TypeScript:** `tsc --noEmit` → exit 0. No type errors.

**ESLint:** `npm run lint` → **6 errors, 1 warning** (so `npm run verify` currently fails at the lint step):

| File                          | Rule                       | Detail                                                                               |
| ----------------------------- | -------------------------- | ------------------------------------------------------------------------------------ |
| `authStyles.ts:1`             | `d11/single-export`        | 2 exports in one file (Rule #1: one export per file)                                 |
| `CalendarEventCard.tsx:19`    | `max-lines-per-function`   | 89 lines > 80                                                                        |
| `CalendarMonthView.tsx:31`    | `max-lines-per-function`   | 112 lines > 80                                                                       |
| `CircularDetailCard.tsx:13`   | `max-lines-per-function`   | 89 lines > 80                                                                        |
| `CalendarMonthDayCell.tsx:14` | `complexity`               | 12 > 10                                                                              |
| `NavLink.tsx:8`               | `complexity`               | 11 > 10                                                                              |
| `CircularsReportTable.tsx:3`  | `no-unused-vars` (warning) | `TABLE_BODY_ROW` imported but unused — leftover from the table-styles centralization |

**Other checks:** no file exceeds the 300-line cap · no broken `className` attributes · no TODOs/FIXMEs · no new `console.log` (one pre-existing in `ServiceWorkerRegister.tsx:13`) · i18n **711 = 711 keys**, zero missing on either side.

---

## 4. Runtime snapshot (dev server on :3000)

- `/en`, `/maintenance`, `/calendar`, `/reports`, `/settings`, `/settings/school` → **200**; `/maintenance` unauthenticated → 307 → `/login` (auth guard correct).
- Fresh page loads hydrate cleanly. One hydration warning was logged mid-refresh while files were being edited concurrently (Fast Refresh artifact) — it did not reproduce on fresh loads.
- MOE theme live: `<html class="moe">` → root tokens (`--primary #14254a`, white canvas, navy topbar gradient `#0B1530→#14254A`).

---

## 5. Recommendations (priority order)

1. **Fix the 6 lint errors** (split `authStyles.ts` exports; refactor the three over-size functions and two over-complex ones; drop the unused `TABLE_BODY_ROW` import) — then `npm run verify` is green again.
2. **Restore dark-theme status overrides** in `.dark` and `.midnight` (`--success: #4ade80`, `--warning: #fbbf24`, `--info: #38bdf8`, matching foregrounds) for AA contrast.
3. **Commit** — 159 modified + 10 new files sit on top of a commit from 29 Oct 07:13; this is a large unversioned surface.
4. Optional: tokenize the 7 glass literals and the navy rgba shadows if you want a 100 % token-pure codebase; document that `:root` **is** the MOE theme (the `.moe` class intentionally has no block — `defaultTheme="moe"` resolves to root).
