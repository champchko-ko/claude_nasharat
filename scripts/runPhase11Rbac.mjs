import { spawnSync } from "node:child_process";
import { readLocalSupabaseEnv } from "./readLocalSupabaseEnv.mjs";
import { assertLocalSupabaseUrl } from "./assertLocalSupabaseUrl.mjs";

export function runPhase11() {
  const env = readLocalSupabaseEnv();
  const url = assertLocalSupabaseUrl(env.API_URL ?? env.SUPABASE_URL);
  const anonKey = env.ANON_KEY ?? "";
  const serviceKey = env.SERVICE_ROLE_KEY ?? "";

  if (!anonKey || !serviceKey) {
    console.error("The local stack did not report an anon/service key. Refusing to run.");
    process.exit(1);
  }

  const childEnv = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  };

  console.log(`Running Phase 11 RBAC Battery against ${url}...`);
  const result = spawnSync(process.execPath, ["supabase/tests/phase11.rbac.test.mjs"], {
    env: childEnv,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

try {
  runPhase11();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
