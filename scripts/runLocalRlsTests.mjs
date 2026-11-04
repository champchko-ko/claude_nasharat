// Runs the RLS harness + battery against the LOCAL Supabase stack only.
//
// Production incident (2026-10-28): `test:rls` loaded `.env.local`, which points
// at the hosted project, so a destructive fixture test wrote to production.
// This runner reads the credentials from the local CLI and refuses any
// non-loopback host.
import { spawnSync } from "node:child_process";
import { readLocalSupabaseEnv } from "./readLocalSupabaseEnv.mjs";
import { assertLocalSupabaseUrl } from "./assertLocalSupabaseUrl.mjs";

const SUITES = ["supabase/tests/rls.harness.test.mjs", "supabase/tests/rls.battery.test.mjs"];

/**
 * The battery creates its own platform owner, and 0020's trigger allows only
 * one. On a database that already holds an owner — a seeded demo database, for
 * instance — the fixture's owner assignment is rejected, so every owner-scoped
 * check fails and the run looks like a security regression.
 */
async function findExistingPlatformOwner(url, serviceKey) {
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  const ownerRoles = await fetch(`${url}/rest/v1/roles?select=id&key=eq.owner&school_id=is.null`, {
    headers,
  });
  if (!ownerRoles.ok) {
    throw new Error(`Preflight failed reading roles: HTTP ${ownerRoles.status}`);
  }
  const roles = await ownerRoles.json();
  if (!Array.isArray(roles) || roles.length === 0) {
    return false;
  }

  const roleIds = roles.map((role) => role.id).join(",");
  const assignments = await fetch(
    `${url}/rest/v1/user_role_assignments?select=id&role_id=in.(${roleIds})&school_id=is.null&limit=1`,
    { headers },
  );
  if (!assignments.ok) {
    throw new Error(`Preflight failed reading assignments: HTTP ${assignments.status}`);
  }
  const rows = await assignments.json();
  return Array.isArray(rows) && rows.length > 0;
}

export async function runLocalRlsTests() {
  const env = readLocalSupabaseEnv();
  const url = assertLocalSupabaseUrl(env.API_URL ?? env.SUPABASE_URL);
  const anonKey = env.ANON_KEY ?? "";
  const serviceKey = env.SERVICE_ROLE_KEY ?? "";

  if (!anonKey || !serviceKey) {
    console.error("The local stack did not report an anon/service key. Refusing to run.");
    process.exit(1);
  }

  if (await findExistingPlatformOwner(url, serviceKey)) {
    console.error(
      [
        "Refusing to run: this database already has a platform owner.",
        "",
        "The battery creates its own owner, and only one is allowed (0020). A seeded",
        "or previously used database therefore fails ~15 owner-scoped checks — those",
        "failures say nothing about the policies.",
        "",
        "Run `supabase db reset` first, then `npm run test:rls`, then `npm run seed:local`.",
      ].join("\n"),
    );
    process.exit(1);
  }

  const childEnv = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  };

  console.log(`RLS target: ${url} (local)`);

  for (const file of SUITES) {
    const result = spawnSync(process.execPath, [file], { env: childEnv, stdio: "inherit" });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}

try {
  await runLocalRlsTests();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
