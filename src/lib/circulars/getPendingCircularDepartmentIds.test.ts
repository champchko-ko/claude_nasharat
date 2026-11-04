import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSchoolDepartments } from "@/lib/school/getSchoolDepartments";
import { getPendingCircularDepartmentIds } from "./getPendingCircularDepartmentIds";

vi.mock("@/lib/school/getSchoolDepartments", () => ({
  getSchoolDepartments: vi.fn(),
}));

interface QueryResult {
  data: unknown;
  error: null;
}

/** Chainable, thenable query stub: `.eq()` returns itself. */
function chain(result: QueryResult) {
  const builder = {
    eq: () => builder,
    maybeSingle: () => Promise.resolve(result),
    then: (resolve: (value: QueryResult) => void) => resolve(result),
  };
  return builder;
}

function buildClient({
  circular,
  targets,
  responses,
}: {
  circular: Record<string, unknown> | null;
  targets: Array<{ circular_id: string; department_id: string | null }>;
  responses: Array<{ circular_id: string; department_id: string; status: string }>;
}): SupabaseClient {
  return {
    from: (table: string) => ({
      select: () => {
        if (table === "circulars") {
          return chain({ data: circular, error: null });
        }
        if (table === "circular_targets") {
          return chain({ data: targets, error: null });
        }
        return chain({ data: responses, error: null });
      },
    }),
  } as unknown as SupabaseClient;
}

const departments = [
  {
    id: "d1",
    school_id: "s1",
    name_ar: "العلوم",
    name_en: "Science",
    is_active: true,
    created_at: "",
  },
  {
    id: "d2",
    school_id: "s1",
    name_ar: "الرياضيات",
    name_en: "Math",
    is_active: true,
    created_at: "",
  },
];

const publishedCircular = {
  id: "c1",
  school_id: "s1",
  ref_number: "CIR-1",
  title: "Broadcast",
  category: "general",
  priority: "normal",
  status: "published",
  publish_at: "2026-01-01T00:00:00Z",
  due_at: "2026-02-01T00:00:00Z",
};

describe("getPendingCircularDepartmentIds", () => {
  beforeEach(() => {
    vi.mocked(getSchoolDepartments).mockResolvedValue(departments);
  });

  it("treats a circular with no target rows as targeting every active department", async () => {
    const client = buildClient({ circular: publishedCircular, targets: [], responses: [] });

    await expect(getPendingCircularDepartmentIds(client, "c1")).resolves.toEqual(["d1", "d2"]);
  });

  it("excludes departments that already responded", async () => {
    const client = buildClient({
      circular: publishedCircular,
      targets: [],
      responses: [{ circular_id: "c1", department_id: "d1", status: "acknowledged" }],
    });

    await expect(getPendingCircularDepartmentIds(client, "c1")).resolves.toEqual(["d2"]);
  });

  it("excludes not_applicable answers instead of chasing them", async () => {
    const client = buildClient({
      circular: publishedCircular,
      targets: [],
      responses: [{ circular_id: "c1", department_id: "d1", status: "not_applicable" }],
    });

    await expect(getPendingCircularDepartmentIds(client, "c1")).resolves.toEqual(["d2"]);
  });

  it("returns nobody for a circular that is not published", async () => {
    const client = buildClient({
      circular: { ...publishedCircular, status: "completed" },
      targets: [],
      responses: [],
    });

    await expect(getPendingCircularDepartmentIds(client, "c1")).resolves.toEqual([]);
  });
});
