import { execSync } from "node:child_process";
import url from "node:url";

export function createArchive(outputPath) {
  const target = outputPath || `school-admin-portal-${Date.now()}.zip`;
  console.log(`Packaging clean repository archive into ${target}...`);
  execSync(`git archive -o "${target}" HEAD`, { stdio: "inherit" });
  console.log(`Archive created successfully: ${target}`);
  return target;
}

const currentFile = url.fileURLToPath(import.meta.url);
if (process.argv[1] && process.argv[1] === currentFile) {
  createArchive(process.argv[2]);
}
