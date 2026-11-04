import { defineConfig, devices } from "@playwright/test";
import { assertLocalSupabaseUrl } from "./scripts/assertLocalSupabaseUrl.mjs";
import { readLocalSupabaseEnv } from "./scripts/readLocalSupabaseEnv.mjs";

// E2E talks to the LOCAL Supabase stack only.
//
// `NEXT_PUBLIC_*` variables are inlined into the client bundle at build time
// (see src/lib/env/getClientEnv.ts), so a server started from the usual
// `.env.local` would ship the hosted project's URL to the browser even if the
// test process pointed elsewhere. These tests create real users, schools,
// circulars and tickets through the UI; pointing them at production would be a
// data incident. The credentials therefore come from `supabase status`, are
// checked to be loopback, and are used for the build, the server and the test
// workers.
const localEnv = readLocalSupabaseEnv();
const supabaseUrl = assertLocalSupabaseUrl(localEnv.API_URL);
const anonKey = localEnv.ANON_KEY;
const serviceRoleKey = localEnv.SERVICE_ROLE_KEY;

if (!anonKey || !serviceRoleKey) {
  throw new Error(
    "The local Supabase stack did not report anon/service keys. Run `supabase start`.",
  );
}

// Workers inherit this process's env, so the fixtures seed the same stack the
// app was built against.
process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = anonKey;
process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  use: {
    // A dedicated port: the developer's `npm run dev` usually owns 3000, and
    // reusing it would test a server built for another environment.
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // A fresh build is required, not just a fresh process: the public Supabase
    // URL is baked into the browser bundle. Reusing a running server would
    // silently test whichever project that server was built for.
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
      serviceRoleKey,
      APP_URL: "http://localhost:3100",
      SCHOOL_TIMEZONE: "Asia/Kuwait",
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
