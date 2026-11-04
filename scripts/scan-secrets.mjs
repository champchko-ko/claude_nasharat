import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".zwork",
  "coverage",
  "playwright-report",
  "test-results",
  "out",
  "build",
]);
// Next.js build output: `.next`, plus every alternate `distDir` derived from it
// (the E2E gate builds into `.next-e2e`, see playwright.config.ts). Bundles
// legitimately contain the inlined public Supabase anon key, which is a JWT and
// would otherwise be reported as a leaked secret on every run after an E2E.
const BUILD_OUTPUT_DIR = /^\.next($|-)/;
const ENV_FILE = /^\.env(\..+)?$/;
const PATTERNS = [
  {
    name: "JWT-like secret",
    re: /eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/,
  },
  { name: "private key block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    name: "generic API key",
    re: /\b(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|sb_secret_[A-Za-z0-9_-]{30,})\b/,
  },
];

function isGitIgnored(relativePath) {
  try {
    execSync(`git check-ignore -q -- "${relativePath}"`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function scanFile(full, findings) {
  let size = 0;
  try {
    size = statSync(full).size;
  } catch {
    return;
  }
  if (size > 1_000_000) return;
  let text;
  try {
    text = readFileSync(full, "utf8");
  } catch {
    return;
  }
  for (const { name, re } of PATTERNS) {
    if (re.test(text)) findings.push(`${full}: matches ${name}`);
  }
}

function main() {
  const findings = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !BUILD_OUTPUT_DIR.test(entry.name)) {
          walk(join(dir, entry.name));
        }
        continue;
      }
      const rel = relative(process.cwd(), join(dir, entry.name));
      if (ENV_FILE.test(entry.name)) {
        // The committed template is scanned for accidental real keys;
        // git-ignored env files legitimately hold secrets and are skipped.
        if (entry.name === ".env.example") {
          scanFile(join(dir, entry.name), findings);
          continue;
        }
        if (!isGitIgnored(rel)) findings.push(`${rel}: env file is not git-ignored`);
        continue;
      }
      scanFile(join(dir, entry.name), findings);
    }
  };
  walk(process.cwd());
  if (findings.length > 0) {
    console.error("Secret scan failed:");
    for (const finding of findings) console.error(` - ${finding}`);
    process.exit(1);
  }
  console.log("Secret scan passed.");
}

main();
