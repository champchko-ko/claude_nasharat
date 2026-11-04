import { createClient } from "@supabase/supabase-js";
import { readE2eEnv } from "./readE2eEnv";

/** Service-role client used to seed and inspect the local E2E fixture. */
export function createE2eAdminClient() {
  const env = readE2eEnv();
  return createClient(env.url, env.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
