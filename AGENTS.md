# AGENTS.md — Mandatory Repository Engineering Rules

These instructions are mandatory for every AI coding agent working in this repository, including Gemini CLI, Gemini Code Assist, and Antigravity.

They apply to ALL activities: implementation, debugging, refactoring, testing, code reviews, database operations, security changes, documentation, and deployment.

**Priority: Correctness, security, data integrity, and preservation of existing functionality always take precedence over speed and convenience.**

---

<!-- BEGIN:modularity-rule -->

## RULE #1 (NON-NEGOTIABLE): ONE FUNCTION PER FILE, NO BIG FILES

This is the most important structural rule in this repository. Every agent MUST follow it.

1. **One function per file.** Each function/component/hook lives in its own file, named after it (e.g. `hasAnyPlatformOwner.ts` → `hasAnyPlatformOwner`). Do not bundle unrelated functions, helpers, or utilities into one file.
2. **No big files.** A file is capped at approximately **300 lines** (enforced as `max-lines: 300` in `eslint.config.mjs`). If a file grows past approximately 300 lines, split it by function before doing anything else.
3. **Cohesive exceptions.** A file up to approximately 300 lines may stay as one unit when its functions form a cohesive, inseparable group — most notably a component together with its tightly coupled sub-parts (e.g. a shadcn primitive exporting a component and its child elements). Do not split these artificially.
4. **One runtime export per file.** This is additionally enforced by the `d11/single-export` ESLint rule.
5. **Never add a second function to an existing file to save time.** Create a new file.

### Required carve-outs (the rule cannot apply literally)

- Next.js framework files (`src/app/**/{layout,page,route,template,error,loading,not-found,global-error}.tsx`) must export their framework functions (`generateMetadata`, `generateStaticParams`, `default`, etc.) from one file — this is a framework contract.
- Barrel files (`index.ts`) re-export by design.
- `*.config.*` and `*.{test,spec,stories}.*` files aggregate by design.
- `src/components/ui/**` follows the shadcn generator convention (component + sub-parts in one file) and is only bounded by the approximately 300-line cap.

Any new file must also satisfy the approximately 300-line cap and, outside the carve-outs above, exactly one runtime export.

**Additional requirements:**

- Never split files mechanically without understanding dependencies, imports, exports, state, side effects, and execution order.
- Preserve existing public interfaces and behavior when extracting functions.
- Update all affected imports and references.
- Verify circular dependencies are not introduced.
- Run the relevant tests and type checks after structural changes.
- Do not create meaningless files or artificial abstractions merely to satisfy line counts.

<!-- END:modularity-rule -->

---

<!-- BEGIN:language-rule -->

## RULE #2: LANGUAGE — ALWAYS RESPOND IN ENGLISH

Never respond to the user in Arabic under any circumstances.

All communication, explanations, code walkthroughs, comments intended for the user, reports, and answers must be strictly in English, even when user prompts contain Arabic or when discussing Arabic UI text/content.

Arabic application content and translations must, of course, remain Arabic when required by the application's functionality.

<!-- END:language-rule -->

---

<!-- BEGIN:nextjs-agent-rules -->

## RULE #3: NEXT.JS — NEVER ASSUME FRAMEWORK KNOWLEDGE

**This is NOT necessarily the Next.js version you know.**

This version may contain breaking changes. APIs, conventions, and file structures may differ from your training data.

Before writing or modifying any Next.js code:

1. Identify the actual installed Next.js version.
2. Read the relevant documentation in `node_modules/next/dist/docs/`, resolved from this file's directory. In monorepos, the `next` package may not be visible from the repository root.
3. Verify the actual API, supported conventions, and migration requirements against the installed version.
4. Heed deprecation notices.
5. Never rely solely on remembered Next.js APIs or examples from older versions.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## RULE #4: ZERO HALLUCINATION — EVIDENCE BEFORE ASSUMPTIONS

**Never invent facts about this repository or claim something exists without verifying it.**

1. Never invent files, functions, components, hooks, APIs, database fields, schemas, routes, permissions, environment variables, dependencies, or application behavior.
2. Never assume an implementation exists just because its name appears in documentation, a previous AI response, or a task description.
3. Inspect the actual source code before making implementation decisions.
4. Trace relevant dependencies, callers, imports, data flows, and consumers before modifying existing functionality.
5. Verify framework APIs, library versions, and third-party integration behavior against installed packages or authoritative documentation.
6. Never fabricate terminal output, test results, execution logs, API responses, screenshots, or successful operations.
7. Distinguish clearly between:
   - VERIFIED: Confirmed directly through source inspection or reliable evidence.
   - INFERRED: A reasonable conclusion that has not been directly verified.
   - UNVERIFIED: Insufficient evidence to establish correctness.
   - BLOCKED: Verification or implementation cannot proceed because of a missing dependency, permission, or required information.
8. When requirements, business rules, or implementation details are unknown, explicitly identify the uncertainty instead of inventing an answer.
9. Never treat AI-generated suggestions, comments, TODOs, or existing documentation as proof that the corresponding implementation works.
10. Never claim complete understanding of the application after inspecting only a small portion of the codebase.

**Source code and actual execution results are authoritative. Assumptions are not evidence.**

---

## RULE #5: NO FAKE FIXES — ROOT CAUSE ONLY

**Fix the actual problem. Never hide, suppress, bypass, or cosmetically disguise it.**

Strictly prohibited:

1. Empty `catch` blocks or swallowed exceptions.
2. Returning fake success responses when an operation fails.
3. Replacing failed operations with meaningless fallback values.
4. Disabling validation, authentication, authorization, security checks, or tests to eliminate errors.
5. Suppressing warnings or errors without understanding their cause.
6. Using arbitrary timeouts, retries, delays, or hardcoded values to conceal synchronization problems.
7. Replacing real functionality with mocks, stubs, placeholders, or simulated results in production code.
8. Changing tests or expected results simply to make an incorrect implementation pass.
9. Removing failing functionality instead of fixing it.
10. Catching errors and silently continuing when the application should stop or report failure.

### Mandatory debugging procedure

For every bug:

1. Reproduce the issue whenever possible.
2. Identify the exact failing operation.
3. Trace the execution path and relevant dependencies.
4. Establish the root cause using actual evidence.
5. Implement the smallest correct fix.
6. Add a regression test reproducing the original failure.
7. Verify the fix and check for regressions.

If the root cause cannot be established, do not pretend it has been fixed. Explain what remains unknown.

---

## RULE #6: ZERO UNAUTHORIZED HARDCODING

**Production functionality must use authoritative application data, not invented or manually fabricated values.**

Never hardcode:

- User-specific or tenant-specific information.
- Financial information, or report results.
- Dashboard statistics, KPIs, chart values, or calculated metrics.
- User roles, permissions, or authorization decisions.
- Database records or API responses intended to represent live application data.
- Environment-specific URLs, credentials, API keys, tokens, or secrets.
- Business calculations, thresholds, or rules that should come from an authoritative configuration or documented specification.

### Mandatory requirements

1. Use the actual database, authenticated session, authorized APIs, and existing application state as the authoritative sources.
2. Derive dashboards, reports, charts, and statistics from real application data.
3. Reuse existing business logic rather than implementing competing versions of the same calculation.
4. Centralize legitimate constants and configuration.
5. Never use fabricated data to make an unfinished feature appear functional.
6. Never silently substitute mock data when an API or database request fails.
7. Clearly distinguish unavailable data from legitimate zero values.
8. Keep test fixtures and mock data isolated from production functionality.

### Legitimate exceptions

Hardcoded values are permitted only when they are genuinely appropriate, such as:

- Immutable technical constants.
- Explicitly documented default configuration values.
- Static UI labels and design tokens.
- Isolated test fixtures and mock data.
- Framework-required configuration.

Every exception must have a legitimate technical purpose.

---

## RULE #7: NEVER DESTROY EXISTING FUNCTIONALITY

**A requested change is NOT permission to remove unrelated functionality.**

1. Never delete, disable, bypass, or silently simplify existing features.
2. Never remove existing options, workflows, validations, integrations, permissions, or business rules without explicit authorization.
3. Before changing a shared component, inspect its consumers throughout the application.
4. Preserve existing API contracts, function signatures, component interfaces, database schemas, and expected behavior unless an explicitly approved change requires otherwise.
5. Never replace a complete implementation with a simplified version that loses existing capabilities.
6. Never perform unrelated refactoring during a focused bug fix.
7. Never overwrite user changes or existing work without understanding their purpose.
8. When a breaking change is necessary, document its impact and provide an appropriate migration strategy.

### Regression prevention

After every significant modification:

- Inspect all affected callers and consumers.
- Verify functionality within the modified component.
- Verify functionality on other pages that depend on it.
- Verify shared application workflows.
- Check for accidental deletions and broken integrations.

**A fix that solves one problem while breaking another is not an acceptable fix.**

---

## RULE #8: DATA INTEGRITY & BUSINESS LOGIC

Never invent, approximate, or silently modify business rules or calculation formulas.

For every important calculation:

1. Identify the authoritative source of the data.
2. Identify the exact formula and business rules.
3. Trace the data transformations.
4. Verify the final result against independently calculated expected values.
5. Handle missing, invalid, duplicated, stale, and inconsistent records explicitly.
6. Verify that reports, dashboards, charts, exports, and summaries use consistent business logic.
7. Verify date ranges, time zones, rounding, percentages, and aggregation rules.
8. Never silently convert missing or invalid data into zero.
9. Never count the same record multiple times unless explicitly required by the business rules.
10. Never display a calculated metric without being able to identify its source and calculation method.

If a business rule is not documented or established in the existing implementation, request clarification rather than inventing one.

---

## RULE #9: SECURITY — NEVER BYPASS SAFEGUARDS

Security is mandatory, not optional.

1. Never bypass authentication or authorization.
2. Never trust client-side permission checks as the actual security boundary.
3. Enforce authorization on the server for every protected operation.
4. Validate resource ownership and access permissions before reading or modifying data.
5. Preserve user isolation across database queries, APIs, background jobs, exports, reports, and storage.
6. Never allow users to access another user's information by manipulating IDs, URLs, request bodies, or API parameters.
7. Apply least-privilege access.
8. Never expose credentials, secrets, private records, or sensitive information in client-side code, logs, or error responses.
9. Validate all external and user-provided inputs.
10. Never weaken security rules to make a test or feature work.

### Multi-tenant applications

Tenant identity must come from the established trusted authentication and tenant-resolution mechanism.

Never trust a client-supplied tenant ID without server-side validation.

Every tenant-scoped operation must be verified for correct tenant ownership and authorization.

Test cross-tenant access attempts explicitly.

---

## RULE #10: TESTING — NEVER CLAIM SUCCESS WITHOUT EXECUTION

**Writing a test is not the same as passing a test. Building an application is not proof that it works.**

1. Execute relevant tests after making changes.
2. Inspect actual command output and exit codes.
3. Run unit, integration, end-to-end, regression, and security tests as applicable.
4. Run type checking, linting, and production builds as appropriate.
5. Add regression tests for confirmed bugs.
6. Test successful operations, failure scenarios, boundary conditions, and unauthorized access.
7. Never modify or delete tests simply to achieve a passing result.
8. Never skip existing tests without documenting the reason.
9. Never report a test as passed when it was not executed.
10. If execution is blocked, explicitly report the reason and mark the result NOT VERIFIED.

For significant changes, verify both the modified functionality and its interactions with dependent modules.

---

## RULE #11: CONTROLLED CHANGES — INSPECT BEFORE EDITING

Before modifying code:

1. Understand the requested change.
2. Inspect the relevant files and existing implementation.
3. Identify dependencies, callers, consumers, and affected workflows.
4. Identify applicable security and business rules.
5. Check existing tests and documentation.
6. Identify potential side effects.

During implementation:

- Make the smallest complete and correct change.
- Follow the repository's existing architecture and conventions.
- Respect the one-function-per-file and 300-line rules.
- Do not introduce unnecessary dependencies.
- Do not duplicate existing functionality.
- Do not perform unrelated cleanup or refactoring.

After implementation:

- Review the complete diff.
- Check for accidental deletions.
- Check for unused imports and broken references.
- Check for unintended behavior changes.
- Check security implications.
- Run relevant verification commands.

Never make broad, destructive changes without first establishing their impact.

---

## RULE #12: DEPENDENCIES & ENVIRONMENT INTEGRITY

1. Never install, upgrade, downgrade, or remove dependencies without establishing why the change is necessary.
2. Inspect the existing package manager, lockfile, installed versions, and dependency constraints.
3. Never assume the latest library version is compatible with this project.
4. Avoid unnecessary dependency changes.
5. Never modify environment variables or deployment settings based on guesses.
6. Never expose or overwrite secrets.
7. Preserve reproducible builds and lockfile integrity.
8. Verify compatibility with the actual runtime and deployment environment.
9. Never claim that a third-party service integration works without verifying its actual behavior or providing a clear explanation of what could not be tested.

---

## RULE #13: DOCUMENTATION MUST MATCH REALITY

1. Never document a feature as implemented when it is only planned or partially implemented.
2. Never document tests as passing without execution evidence.
3. Never invent API endpoints, configuration options, environment variables, or supported workflows.
4. Update relevant documentation when actual behavior changes.
5. Keep architecture documentation consistent with the source code.
6. Clearly identify incomplete functionality, limitations, and required configuration.
7. Do not hide known defects behind optimistic documentation.

---

## RULE #14: MANDATORY COMPLETION REPORT

At the end of every implementation or debugging task, provide a concise but evidence-based report containing:

### 1. Findings

What was actually inspected and verified.

### 2. Root Cause

The confirmed cause of the problem, or an explicit statement that it could not be established.

### 3. Changes Made

Exact file paths and a description of the actual changes.

### 4. Functionality Preserved

Existing features, workflows, integrations, and dependencies checked for regressions.

### 5. Security Impact

Authentication, authorization, tenant isolation, validation, and data access implications.

### 6. Tests Executed

Exact commands executed and their actual results.

### 7. Unverified Items

Anything that could not be executed, accessed, or conclusively verified.

### 8. Remaining Risks

Known limitations, unresolved problems, and required follow-up actions.

Use these statuses accurately:

- **VERIFIED:** Directly confirmed through source inspection or reliable evidence.
- **TESTED — PASSED:** Actually executed and passed.
- **TESTED — FAILED:** Actually executed and failed.
- **NOT VERIFIED:** Insufficient evidence to confirm correctness.
- **BLOCKED:** Unable to proceed because of missing information, dependencies, or permissions.
- **NOT APPLICABLE:** The check genuinely does not apply to the task.

Never claim 100% correctness, complete security, or production readiness without sufficient evidence to support the claim.

---

## RULE #15: STOP WHEN YOU CANNOT VERIFY

When information is missing or evidence is insufficient:

1. Do not invent missing requirements.
2. Do not guess at security-sensitive behavior.
3. Do not create fake implementations to satisfy the task superficially.
4. Do not replace unknown behavior with arbitrary defaults.
5. Inspect the available source code, documentation, tests, and dependencies.
6. Ask the user for clarification when the missing information materially affects correctness.
7. If a safe partial implementation is possible, clearly identify its limitations.
8. If proceeding would risk data loss, security, or existing functionality, stop and explain the risk.

Never confuse an incomplete investigation with a completed task.

---

## FINAL NON-NEGOTIABLE ENGINEERING PRINCIPLE

**An honest incomplete task is always better than a fabricated completed task.**

- Evidence over assumptions.
- Correctness over speed.
- Root-cause fixes over symptom suppression.
- Real data over fabricated data.
- Security over convenience.
- Existing functionality over unnecessary rewrites.
- Actual test results over claimed success.
- Transparency over pretending.

**The agent's responsibility is to make the application actually work — not merely to produce code that looks correct.**
