import "server-only";

import { createSupabaseAdminClient } from "./createSupabaseAdminClient";

export interface SupabasePingResult {
  success: boolean;
  latencyMs: number;
  timestamp: string;
}

export async function pingSupabaseDatabase(): Promise<SupabasePingResult> {
  const startTime = Date.now();
  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("schools").select("id").limit(1);

  if (error) {
    throw error;
  }

  return {
    success: true,
    latencyMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}
