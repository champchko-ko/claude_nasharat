// Applies supabase/seed.sql to the LOCAL Supabase stack only.
//
// Seeding is opt-in (`npm run seed:local`) rather than automatic on
// `supabase db reset`, because the RLS battery asserts exact catalogue and
// fixture counts: demo rows would change those counts and mask real
// regressions. Reset gives a clean database; this script gives you demo data
// on top of it.
//
// No URL guard is needed here: the work is done through `docker exec` against
// the container the local stack created, so a hosted project is unreachable
// by construction.
import { execFileSync } from "node:child_process";

const SEED_FILE = "supabase/seed.sql";

function findDatabaseContainer() {
  const names = execFileSync(
    "docker",
    ["ps", "--filter", "name=supabase_db_", "--format", "{{.Names}}"],
    { encoding: "utf8" },
  )
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (names.length === 0) {
    throw new Error("No Supabase database container is running. Run `supabase start` first.");
  }
  if (names.length > 1) {
    throw new Error(`More than one Supabase database container is running: ${names.join(", ")}`);
  }
  return names[0];
}

const container = findDatabaseContainer();

execFileSync("docker", ["cp", SEED_FILE, `${container}:/tmp/seed.sql`], { stdio: "inherit" });
execFileSync(
  "docker",
  [
    "exec",
    container,
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    "/tmp/seed.sql",
  ],
  { stdio: "inherit" },
);

console.log(`Seeded ${container} from ${SEED_FILE}.`);
console.log("Sign in with owner@local.test / LocalDev123! (also admin@, head@, staff@local.test).");
console.log(
  "Before `npm run test:rls`, run `supabase db reset` (the battery needs a clean database).",
);
