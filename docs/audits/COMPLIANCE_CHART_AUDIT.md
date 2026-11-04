# Compliance Calculation & Chart — Audit and Rework

**Date:** 2026-11-01
**Scope:** the dashboard compliance widget, the calculation that feeds it, the reports page and both CSV exports.
**Contract:** `Dashboard_Fix_All_Issues_Prompt.md` §1 and Phase 4; `School_Admin_Portal_Inspection_Report.md` §4.2–4.6 (K1–K10, G1).

---

## 1. Verdict

The compliance pipeline is now **one calculation** with **one set of rules**, and every surface reads it:

- Circulars that create an obligation: `published`, `in_progress`, `completed`, `overdue`.
- Compliant response: `acknowledged`, `approved`, `completed`. `rejected` and `pending` stay outstanding.
- `not_applicable` is **removed from the denominator** (counted separately, never as compliant or pending).
- Outstanding work is split into **overdue** (`due_at` in the past) and **not yet due**.
- A scope with nothing targeted reports **`null`**, rendered as `—`, never 100%.

The dashboard, the reports page, the CSV and the reminder engine all read `calculateCompliance`, so they cannot disagree for the same data.

---

## 2. Baseline (be honest about what "before" means)

Two different baselines exist, and earlier drafts of this document conflated them:

- **`HEAD` (`4a53973`)** ships `DashboardComplianceDonut`, `DashboardComplianceLegend`, `computeDonutSegments` and `donutPalette` — a donut whose arcs were each department's share of responses.
- **The working tree** this task started from also contained an **uncommitted** intermediate redesign: a radial gauge (`DashboardComplianceMeter`), rate-only progress bars (`DashboardComplianceBars`/`BarRow`) and a `collectTargetedCircularIds` helper. Those files were never committed, so they do not appear in `git log`; they were the actual starting point of this work and were deleted by it.

The final state deletes both variants: the donut files (still in `HEAD`) and the untracked gauge/bars files.

---

## 3. Problems found

| #      | Problem                                                                                                                                                                                          | Evidence                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| K1/K10 | No status filter: draft, cancelled and archived circulars added phantom targets; the selector defaulted to the newest circular, which could be a draft at 0%, and still offered "Remind" for it. | `getCircularsReportData`, `getDashboardComplianceData`   |
| K2     | "Responded" was defined twice — department/overall used `acknowledged/approved/completed`, the per-circular rows counted any response, including `rejected`.                                     | `computeDepartmentCompliance` vs `mapCircularReportRows` |
| K3     | The per-circular row fell back to the raw response count, which could produce a false 100%.                                                                                                      | `mapCircularReportRows`                                  |
| K4     | Zero targets produced 100% on four surfaces.                                                                                                                                                     | report layer                                             |
| K5     | `not_applicable` stayed in the denominator, so a department could never reach 100%.                                                                                                              | `isRespondedStatus` + counting                           |
| K6     | A partly compliant department never appeared as pending.                                                                                                                                         | badge lists                                              |
| K7     | The dashboard ignored the caller's department scope while the reports page applied it.                                                                                                           | both pages                                               |
| K8     | Due dates were ignored: overdue and not-yet-due looked identical.                                                                                                                                | calculation + chart                                      |
| K9     | Targets were filtered inside nested loops (~100M operations at 20 departments × 1,000 circulars × 5,000 targets).                                                                                | `computeDepartmentCompliance`                            |
| G1     | The donut drew nothing for a 0% department, repeated colours after ten departments, used hard-coded hex, and hid detail behind hover.                                                            | `DashboardComplianceDonut`                               |

---

## 4. What the code does now

**One calculation** — `src/lib/reports/calculateCompliance.ts`:

1. `isDeliveredStatus` filters circulars once.
2. `buildCircularDepartmentIds` resolves the audience once: explicit target rows, or every active department when a circular has none.
3. `indexResponseStatusByPair` maps the latest response for each `(circular, department)` key.
4. `classifyTargetBucket` assigns `compliant` / `overdue` / `notYetDue` / `notApplicable`.
5. `accumulateCircularCompliance` folds each pair into the circular, department and school counts in one pass.

Returned for every circular and every department: `targeted`, `compliant`, `overdue`, `notYetDue`, `notApplicable`, `percent | null`, plus the responded/pending department references with their outstanding counts.

**Consumers:** `getCircularsReportData` (and therefore the dashboard, the reports page and the CSV), `getPendingDepartmentIdsForSchool`, `getPendingCircularDepartmentIds`.

**Dashboard:** `loadDashboardCompliance` resolves the same authorization and department scope as `assertCanViewReports`, so a `reports.view` holder with a department sees that department on both surfaces. The selector lists the ten most relevant circulars (overdue first, then most recently published), defaults to the first, and discloses when more exist. Reminders are offered only while the selected circular is open (`published`/`in_progress`), and the per-circular pending set uses the same broadcast rule as the chart.

**Chart (`DashboardComplianceDistribution`):**

- Headline percentage, `compliant / targeted` counts, and a three-entry legend (compliant / overdue / not yet due).
- One row per targeted department, sorted lowest compliance first; each row is a three-segment track plus a direct label such as `7/10 · 70%`.
- An 80% benchmark tick on every track, driven by `COMPLIANCE_THRESHOLDS.good`.
- The **lowest five** rows by default, with a control to show all.
- Theme tokens only (`success`, `destructive`, `muted-foreground`), no hover dependency (the numbers are text), RTL-safe logical insets, all copy from `en.json`/`ar.json`.
- Departments with nothing targeted are not drawn (no fabricated 100%).

---

## 5. Verification

| Check                               | Result                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                  | exit 0                                                                                                                          |
| `npx eslint .`                      | exit 0 (300-line, 80-line-function, complexity and single-export gates active)                                                  |
| `npx vitest run`                    | **697 tests passed**                                                                                                            |
| `npm run build`                     | compiled successfully                                                                                                           |
| `npm run test:rls` on a clean reset | **152/152 checks**                                                                                                              |
| `calculateCompliance` §4.2 scenario | overall 3/5 = **60%**, A 2/2, B 1/2, C 0/1, C1 2/3, C3 1/2, draft/cancelled absent, untargeted response ignored                 |
| `not_applicable` case               | denominator 1 of 2, rate 100%, counted separately                                                                               |
| Overdue split                       | `due_at` in the past → overdue; future/absent → not yet due                                                                     |
| Live dashboard (seeded data, owner) | **17% = 1 of 6** (7 targets − 1 not applicable), rows `0/2`, `0/1`, `0/1`, `1/2 · 50%`, default selector = the overdue circular |
| Live reports page (same data)       | **17%**, `1 / 6`, 1 overdue, department table 50/0/0/0, circular rows 100/0/0 — identical to the dashboard                      |

The seed now includes one overdue circular and one `not_applicable` answer so the three states are exercisable by hand.

---

## 6. Remaining limitations

1. **Scale.** The calculation is linear, but it still loads every delivered circular of the school. A SQL aggregate function is the next step beyond a few thousand circulars.
2. **No automated end-to-end test.** The screens were verified by signing in; `npm run test:e2e` still needs to run in CI.
3. **Dark mode and an Arabic screen-reader pass** were not re-verified after the chart change.
4. **Department scope** is unit-tested only indirectly; a scoped-profile test would be the next addition.
