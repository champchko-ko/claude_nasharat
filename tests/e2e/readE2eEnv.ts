import { assertLocalSupabaseUrl } from "../../scripts/assertLocalSupabaseUrl.mjs";

export type E2eEnv = {
  url: string;
  anonKey: string;
  serviceKey: string;
};

/**
 * Reads the local Supabase credentials that `playwright.config.ts` placed in
 * `process.env`. The loopback assertion is repeated here because this file is
 * also reachable from any future setup script that bypasses the config.
 */
export function readE2eEnv(): E2eEnv {
  const url = assertLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!anonKey || !serviceKey) {
    throw new Error(
      "E2E needs the local Supabase stack. Run `npm run test:e2e`, not `playwright test`.",
    );
  }

  return { url, anonKey, serviceKey };
}
