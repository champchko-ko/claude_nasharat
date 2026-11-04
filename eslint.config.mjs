import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// D11 modularity gates (non-negotiable — build_plan.md §4.1):
// one runtime export per file, hard size caps, bounded complexity.
const singleExportRule = {
  meta: {
    type: "problem",
    docs: { description: "D11: at most one runtime export per file" },
    schema: [],
    messages: {
      tooMany:
        "D11 violation: {{count}} exports in this file. Move each export into its own file named after the export.",
    },
  },
  create(context) {
    const filename =
      typeof context.filename === "string" ? context.filename : context.getFilename();
    const isExempt =
      /(^|[\\/])index\.[cm]?[jt]sx?$/.test(filename) ||
      /\.d\.[cm]?ts$/.test(filename) ||
      /\.config\.[cm]?[jt]s$/.test(filename) ||
      /\.(test|spec|stories)\.[cm]?[jt]sx?$/.test(filename) ||
      /[\\/]middleware\.[cm]?ts$/.test(filename) ||
      /[\\/]proxy\.[cm]?ts$/.test(filename) ||
      /[\\/]components[\\/]ui[\\/]/.test(filename) ||
      /[\\/]i18n[\\/]navigation\.ts$/.test(filename);
    if (isExempt) return {};
    let count = 0;
    const bump = (node) => {
      if (node.exportKind === "type") return;
      if (node.declaration) {
        const kind = node.declaration.type;
        if (kind === "TSTypeAliasDeclaration" || kind === "TSInterfaceDeclaration") return;
        count += 1;
        return;
      }
      count += node.specifiers.filter((specifier) => specifier.exportKind !== "type").length;
    };
    return {
      ExportNamedDeclaration: bump,
      ExportDefaultDeclaration: bump,
      "Program:exit"(program) {
        if (count > 1) {
          context.report({ node: program, messageId: "tooMany", data: { count } });
        }
      },
    };
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".next-e2e/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    ".zwork/**",
  ]),
  {
    plugins: { d11: { rules: { "single-export": singleExportRule } } },
    rules: {
      "d11/single-export": "error",
      // RULE #1 (AGENTS.md): one function per file, no big files. A file may
      // stay as one unit up to ~300 lines (e.g. a component with its sub-parts).
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 80, skipBlankLines: true, skipComments: true }],
      complexity: ["error", 10],
    },
  },
  {
    // Exempt from single-export only: framework contracts, barrels, type-only
    // files, tests, the next-intl navigation adapter, and shadcn primitives.
    files: [
      "**/index.{ts,tsx,js,jsx,mjs,cjs,cts,mts}",
      "**/*.d.{ts,mts,cts}",
      "**/*.config.{js,ts,mjs,cjs}",
      "**/*.{test,spec,stories}.{ts,tsx,js,jsx,mjs,cjs}",
      "src/middleware.ts",
      "src/proxy.ts",
      "src/i18n/navigation.ts",
      "src/app/**/{layout,page,route,template,error,loading,not-found,global-error}.{ts,tsx,js,jsx}",
      "src/components/ui/**/*.{ts,tsx}",
    ],
    rules: { "d11/single-export": "off" },
  },
  {
    // Test suites aggregate many cases by design — exempt from size caps
    // (single-export still governs them; see the test pattern above).
    files: ["**/*.{test,spec,stories}.{js,jsx,mjs,cjs,ts,tsx}"],
    rules: { "max-lines": "off", "max-lines-per-function": "off", complexity: "off" },
  },
  {
    // Exempt from size caps: tooling config files only.
    files: ["**/*.config.{js,ts,mjs,cjs}"],
    rules: { "max-lines": "off", "max-lines-per-function": "off", complexity: "off" },
  },
]);

export default eslintConfig;
