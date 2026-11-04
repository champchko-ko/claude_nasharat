// Reads the credentials of the running LOCAL Supabase stack.
//
// The previous npm script used `--env-file=.env.local`, which in this project
// points at the hosted production project. Reading the CLI's own status output
// makes it impossible to pick up production credentials by accident.
import { execSync } from "node:child_process";

export function readLocalSupabaseEnv() {
  let status;
  try {
    // On Windows the CLI is a .cmd shim, which execFile cannot execute directly;
    // the command string is fixed and contains no interpolated input.
    status = execSync("supabase status -o env", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    throw new Error(
      "Could not read `supabase status`. Is the local stack running? (supabase start)",
    );
  }

  const env = {};
  for (const line of status.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/);
    if (match) env[match[1]] = match[2];
  }

  return env;
}
