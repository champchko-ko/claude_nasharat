import { describe, it, expect } from "vitest";
import { sanitizeLogString } from "./sanitizeLogString";

describe("sanitizeLogString", () => {
  it("redacts bearer tokens in log strings", () => {
    const input = "Request failed with Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test";
    expect(sanitizeLogString(input)).toBe("Request failed with Authorization: Bearer [REDACTED]");
  });

  it("redacts credentials inside connection URIs", () => {
    const input =
      "Failed to connect to postgresql://postgres:mypassword123@db.supabase.co:5432/postgres";
    expect(sanitizeLogString(input)).toBe(
      "Failed to connect to postgresql://postgres:[REDACTED]@db.supabase.co:5432/postgres",
    );
  });

  it("redacts email addresses from messages", () => {
    const input = "User teacher.smith@kuwait.edu failed validation in tenant_id 123";
    expect(sanitizeLogString(input)).toBe(
      "User [REDACTED_EMAIL] failed validation in tenant_id 123",
    );
  });

  it("handles non-string or empty input safely", () => {
    expect(sanitizeLogString("")).toBe("");
    expect(sanitizeLogString(null as unknown as string)).toBe("");
  });
});
