import type { z } from "zod";
import { clientEnvSchema } from "./clientEnvSchema";
import { formatEnvIssues } from "./formatEnvIssues";

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function getClientEnv(): ClientEnv {
  // Next.js only inlines statically referenced `process.env.NEXT_PUBLIC_*`
  // expressions in client bundles; passing the whole `process.env` object (as
  // this did) leaves the browser with an empty object. Reference each variable
  // explicitly so it survives inlining (finding N2).
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid public environment variables (check .env.local against .env.example). ${formatEnvIssues(parsed.error)}`,
    );
  }
  return parsed.data;
}
