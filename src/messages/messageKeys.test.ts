import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const MESSAGE_FILES = {
  ar: join(ROOT, "src/messages/ar.json"),
  en: join(ROOT, "src/messages/en.json"),
} as const;

type Messages = Record<string, unknown>;

const messages: Record<keyof typeof MESSAGE_FILES, Messages> = {
  ar: JSON.parse(readFileSync(MESSAGE_FILES.ar, "utf8")) as Messages,
  en: JSON.parse(readFileSync(MESSAGE_FILES.en, "utf8")) as Messages,
};

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      sourceFiles(full, found);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\./.test(entry)) {
      found.push(full);
    }
  }
  return found;
}

function resolvePath(source: Messages, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined,
      source,
    );
}

/** Every leaf key path, so a key added to one locale only is caught. */
function leafKeys(source: Messages, prefix = "", acc: string[] = []): string[] {
  for (const [key, value] of Object.entries(source)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") leafKeys(value as Messages, path, acc);
    else acc.push(path);
  }
  return acc;
}

/**
 * Literal `t("key")` calls, resolved through the translator variable's own
 * namespace. Dynamic keys and translators passed as props are skipped: they
 * cannot be verified statically, and guessing would produce false failures.
 */
function usedKeys(): Array<{ file: string; path: string }> {
  const used: Array<{ file: string; path: string }> = [];

  for (const file of sourceFiles(join(ROOT, "src"))) {
    const source = readFileSync(file, "utf8");
    const translators = new Map<string, string>();

    const declaration =
      /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:["']([^"']*)["'])?\s*\)/g;
    for (const match of source.matchAll(declaration)) {
      translators.set(match[1], match[2] ?? "");
    }

    for (const [variable, namespace] of translators) {
      const call = new RegExp(`\\b${variable}\\(\\s*"([^"$]+)"\\s*[,)]`, "g");
      for (const match of source.matchAll(call)) {
        used.push({
          file: relative(ROOT, file),
          path: namespace ? `${namespace}.${match[1]}` : match[1],
        });
      }
    }
  }

  return used;
}

describe("translation messages", () => {
  it("resolves every literal translation key used in src, in both locales", () => {
    const used = usedKeys();
    // Guard against the scanner silently matching nothing (a passing test that
    // checks zero keys would hide exactly the bug this test exists to catch).
    expect(used.length).toBeGreaterThan(100);

    const missing: string[] = [];

    for (const { file, path } of used) {
      for (const locale of ["ar", "en"] as const) {
        if (resolvePath(messages[locale], path) === undefined) {
          missing.push(`${locale}: ${path} (${file})`);
        }
      }
    }

    expect([...new Set(missing)]).toEqual([]);
  }, 20000);

  it("keeps the ar and en key sets identical", () => {
    const ar = new Set(leafKeys(messages.ar));
    const en = new Set(leafKeys(messages.en));

    expect([...ar].filter((key) => !en.has(key)).sort()).toEqual([]);
    expect([...en].filter((key) => !ar.has(key)).sort()).toEqual([]);
  });
});
