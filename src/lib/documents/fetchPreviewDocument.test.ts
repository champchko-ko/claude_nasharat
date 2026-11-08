import { describe, expect, it, vi } from "vitest";
import { fetchPreviewDocument } from "./fetchPreviewDocument";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("fetchPreviewDocument", () => {
  it("returns document when present with is_published", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        file_path: "p/1.pdf",
        mime_type: "application/pdf",
        status: "published",
        visibility: "public",
      },
      error: null,
    });
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
      }),
    } as unknown as SupabaseClient;

    const res = await fetchPreviewDocument(client, "doc-1");
    expect(res).toEqual({
      file_path: "p/1.pdf",
      mime_type: "application/pdf",
      status: "published",
      visibility: "public",
    });
  });

  it("falls back to querying without is_published when column is missing (error 42703)", async () => {
    const maybeSingleFirst = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "42703" },
    });
    const maybeSingleFallback = vi.fn().mockResolvedValue({
      data: {
        file_path: "p/legacy.pdf",
        mime_type: "application/pdf",
      },
      error: null,
    });

    const client = {
      from: vi
        .fn()
        .mockReturnValueOnce({
          select: vi
            .fn()
            .mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleFirst }) }),
        })
        .mockReturnValueOnce({
          select: vi
            .fn()
            .mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleFallback }) }),
        }),
    } as unknown as SupabaseClient;

    const res = await fetchPreviewDocument(client, "doc-legacy");
    expect(res).toEqual({
      file_path: "p/legacy.pdf",
      mime_type: "application/pdf",
      status: "published",
      visibility: "public",
    });
  });

  it("returns null when document is not found", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
      }),
    } as unknown as SupabaseClient;

    const res = await fetchPreviewDocument(client, "missing");
    expect(res).toBeNull();
  });
});
