import { describe, it, expect } from "vitest";
import { buildAuditCsv } from "./buildAuditCsv";

describe("buildAuditCsv", () => {
  it("formats audit logs with BOM and escaped CSV rows", () => {
    const logs = [
      {
        id: "log-1",
        actor_id: "user-1",
        actor_label: "Admin User",
        action: "profiles.update",
        entity_type: "profiles",
        entity_id: "ent-1",
        created_at: "2026-10-31T00:00:00.000Z",
        metadata: { before: { is_active: true }, after: { is_active: false } },
      },
    ];

    const csv = buildAuditCsv(logs);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Timestamp,Action,Entity Type,Entity ID,Actor,Metadata");
    expect(csv).toContain("profiles.update");
    expect(csv).toContain("Admin User");
  });

  it("handles empty logs array", () => {
    const csv = buildAuditCsv([]);
    expect(csv).toBe("\uFEFFTimestamp,Action,Entity Type,Entity ID,Actor,Metadata");
  });
});
