import { describe, it, expect, vi } from "vitest";
import { applyAuditQueryFilters } from "./applyAuditQueryFilters";

describe("applyAuditQueryFilters", () => {
  it("applies schoolId and filter clauses", () => {
    const mockQuery = {
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    };

    applyAuditQueryFilters(mockQuery, "sch-1", {
      action: "update",
      entityType: "profiles",
      actorLabel: "Alice",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });

    expect(mockQuery.eq).toHaveBeenCalledWith("school_id", "sch-1");
    expect(mockQuery.ilike).toHaveBeenCalledWith("action", "%update%");
    expect(mockQuery.eq).toHaveBeenCalledWith("entity_type", "profiles");
    expect(mockQuery.ilike).toHaveBeenCalledWith("actor_label", "%Alice%");
    expect(mockQuery.gte).toHaveBeenCalledWith("created_at", "2026-10-01");
    expect(mockQuery.lte).toHaveBeenCalledWith("created_at", "2026-10-31");
  });

  it("returns query untouched when no school or filters", () => {
    const mockQuery = {
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    };

    const res = applyAuditQueryFilters(mockQuery);
    expect(res).toBe(mockQuery);
    expect(mockQuery.eq).not.toHaveBeenCalled();
  });
});
