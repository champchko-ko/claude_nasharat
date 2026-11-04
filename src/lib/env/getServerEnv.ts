import type { z } from "zod";
import { formatEnvIssues } from "./formatEnvIssues";
import { serverEnvSchema } from "./serverEnvSchema";

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables (check .env.local against .env.example). ${formatEnvIssues(parsed.error)}`,
    );
  }
  return parsed.data;
}
