import { describe, it, expect } from "vitest";
import { filterCirculars } from "./filterCirculars";
import type { CircularRow } from "./types";

function createDummyCircular(overrides: Partial<CircularRow>): CircularRow {
  return {
    id: "circ-1",
    ref_number: "CIR-2026-001",
    title: "Exam Preparation Plan",
    body: "Content",
    category: "admin",
    priority: "urgent",
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
    targets: [{ id: "t-1", department_id: "dept-math", role_key: null }],
    ...overrides,
  };
}

describe("filterCirculars", () => {
  const c1 = createDummyCircular({
    id: "1",
    ref_number: "CIR-001",
    title: "Math Olympiad",
    status: "published",
    priority: "urgent",
    targets: [{ id: "t1", department_id: "dept-math", role_key: null }],
  });
  const c2 = createDummyCircular({
    id: "2",
    ref_number: "CIR-002",
    title: "Science Fair",
    status: "draft",
    priority: "normal",
    targets: [{ id: "t2", department_id: "dept-science", role_key: null }],
  });

  it("filters by search query matching title or ref number", () => {
    expect(filterCirculars([c1, c2], { search: "math" })).toEqual([c1]);
    expect(filterCirculars([c1, c2], { search: "CIR-002" })).toEqual([c2]);
  });

  it("filters by status", () => {
    expect(filterCirculars([c1, c2], { status: "draft" })).toEqual([c2]);
  });

  it("filters by priority", () => {
    expect(filterCirculars([c1, c2], { priority: "urgent" })).toEqual([c1]);
  });

  it("filters by departmentId", () => {
    expect(filterCirculars([c1, c2], { departmentId: "dept-science" })).toEqual([c2]);
  });
});
