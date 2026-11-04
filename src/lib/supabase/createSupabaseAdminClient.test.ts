import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
  }),
}));

import { createSupabaseAdminClient } from "./createSupabaseAdminClient";

describe("createSupabaseAdminClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a client with service role key and default headers", () => {
    createSupabaseAdminClient();

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-service-key",
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: {} },
      },
    );
  });

  it("attaches actor headers when provided", () => {
    createSupabaseAdminClient({
      actorId: "actor-123",
      actorLabel: "Admin User (admin@school.org)",
    });

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-service-key",
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          headers: {
            "x-actor-id": "actor-123",
            "x-actor-label": "Admin User (admin@school.org)",
          },
        },
      },
    );
  });

  it("sanitizes non-ASCII actor headers with URI encoding", () => {
    createSupabaseAdminClient({
      actorId: "actor-123",
      actorLabel: "أحمد (admin@school.org)",
    });

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-service-key",
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          headers: {
            "x-actor-id": "actor-123",
            "x-actor-label": encodeURIComponent("أحمد (admin@school.org)"),
          },
        },
      },
    );
  });
});
