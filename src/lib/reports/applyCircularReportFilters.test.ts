import { describe, it, expect, vi } from "vitest";
import { applyCircularReportFilters } from "./applyCircularReportFilters";

function createMockQuery() {
  const query = {
    eq: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
  };
  query.eq.mockReturnValue(query);
  query.gte.mockReturnValue(query);
  query.lte.mockReturnValue(query);
  return query;
}

describe("applyCircularReportFilters", () => {
  it("applies status and category filters", () => {
    const query = createMockQuery();

    applyCircularReportFilters(query, { status: "published", category: "admin" });

    expect(query.eq).toHaveBeenCalledWith("status", "published");
    expect(query.eq).toHaveBeenCalledWith("category", "admin");
  });

  it("applies date range filters", () => {
    const query = createMockQuery();

    applyCircularReportFilters(query, { from: "2026-01-01", to: "2026-01-31" });

    expect(query.gte).toHaveBeenCalledWith("created_at", "2026-01-01");
    expect(query.lte).toHaveBeenCalledWith("created_at", "2026-01-31T23:59:59.999Z");
  });
});
