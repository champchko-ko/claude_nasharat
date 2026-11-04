/**
 * Manual / Local keepalive script for Supabase
 * Usage: node --env-file=.env.local scripts/ping-supabase.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE key in environment.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`[${new Date().toISOString()}] Pinging Supabase at ${url}...`);
const start = Date.now();

const { data, error } = await supabase.from("schools").select("id").limit(1);

if (error) {
  console.error("Supabase Ping Failed:", error.message);
  process.exit(1);
}

const latency = Date.now() - start;
console.log(
  `[${new Date().toISOString()}] Supabase ping successful! (Latency: ${latency}ms, records: ${data?.length ?? 0})`,
);
