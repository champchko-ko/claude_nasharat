import { z } from "zod";

// Server runtime also sees the NEXT_PUBLIC_ variables (they are inlined at
// build time), so the admin client can read the project URL from here.
export const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  APP_URL: z
    .string()
    .min(1)
    .default(
      process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
    ),
  SCHOOL_TIMEZONE: z.string().min(1).default("Asia/Kuwait"),
  PLATFORM_BOOTSTRAP_SECRET: z.string().min(8).optional(),
  PLATFORM_OWNER_EMAIL: z.string().email().optional(),
  CRON_SECRET: z.string().min(1).optional(),
  HEALTH_CHECK_SECRET: z.string().min(1).optional(),
  UNDER_CONSTRUCTION_BYPASS_SECRET: z.string().min(1).optional(),
});
