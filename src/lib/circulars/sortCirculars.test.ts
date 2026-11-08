import { describe, it, expect } from "vitest";
import { sortCirculars } from "./sortCirculars";
import type { CircularRow } from "./types";

function createDummyCircular(overrides: Partial<CircularRow>): CircularRow {
  return {
    id: "circ-1",
    ref_number: "CIR-001",
    title: "A Circular",
    body: "Content",
    category: "admin",
    priority: "normal",
    status: "published",
    visibility: "internal",
    response_type: "acknowledgement",
    response_instructions: null,
    allow_response_revision: false,
    publish_at: "2026-10-20T10:00:00Z",
    due_at: "2026-10-30T10:00:00Z",
    created_by: "usr-1",
    closed_at: null,
    created_at: "2026-10-20T10:00:00Z",
    ...overrides,
  };
}

describe("sortCirculars", () => {
  it("sorts by priority descending (urgent > high > normal > low)", () => {
    const c1 = createDummyCircular({ id: "1", priority: "low" });
    const c2 = createDummyCircular({ id: "2", priority: "urgent" });
    const c3 = createDummyCircular({ id: "3", priority: "normal" });

    const sorted = sortCirculars([c1, c2, c3], "priority_desc");
    expect(sorted.map((c) => c.id)).toEqual(["2", "3", "1"]);
  });

  it("sorts by publish_at descending", () => {
    const c1 = createDummyCircular({ id: "1", publish_at: "2026-10-10T00:00:00Z" });
    const c2 = createDummyCircular({ id: "2", publish_at: "2026-10-25T00:00:00Z" });

    const sorted = sortCirculars([c1, c2], "publish_at_desc");
    expect(sorted.map((c) => c.id)).toEqual(["2", "1"]);
  });

  it("sorts by due_at ascending", () => {
    const c1 = createDummyCircular({ id: "1", due_at: "2026-10-28T00:00:00Z" });
    const c2 = createDummyCircular({ id: "2", due_at: "2026-10-15T00:00:00Z" });
    const c3 = createDummyCircular({ id: "3", due_at: null });

    const sorted = sortCirculars([c1, c2, c3], "due_at_asc");
    expect(sorted.map((c) => c.id)).toEqual(["2", "1", "3"]);
  });
});
