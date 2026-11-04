import { describe, it, expect } from "vitest";
import { redactSensitiveData } from "./redactSensitiveData";

describe("redactSensitiveData", () => {
  it("redacts sensitive fields in shallow objects", () => {
    const input = {
      username: "teacher1",
      password: "SuperSecretPassword123",
      apiKey: "secret_live_key",
      email: "teacher@school.test",
      civil_id: "290123456789",
      phone: "+96512345678",
    };

    const output = redactSensitiveData(input) as Record<string, unknown>;
    expect(output.username).toBe("teacher1");
    expect(output.email).toBe("[REDACTED]");
    expect(output.civil_id).toBe("[REDACTED]");
    expect(output.phone).toBe("[REDACTED]");
    expect(output.password).toBe("[REDACTED]");
    expect(output.apiKey).toBe("[REDACTED]");
  });

  it("redacts sensitive fields in nested objects and arrays", () => {
    const input = {
      headers: {
        authorization: "Bearer secret-token-xyz",
        cookie: "session=abcdef",
      },
      users: [
        { id: "1", token: "tok_123" },
        { id: "2", token: "tok_456" },
      ],
    };

    const output = redactSensitiveData(input) as {
      headers: { authorization: string; cookie: string };
      users: Array<{ id: string; token: string }>;
    };

    expect(output.headers.authorization).toBe("[REDACTED]");
    expect(output.headers.cookie).toBe("[REDACTED]");
    expect(output.users[0].token).toBe("[REDACTED]");
    expect(output.users[1].token).toBe("[REDACTED]");
  });

  it("handles non-objects and nulls safely", () => {
    expect(redactSensitiveData(null)).toBe(null);
    expect(redactSensitiveData("hello")).toBe("hello");
    expect(redactSensitiveData(123)).toBe(123);
  });
});
