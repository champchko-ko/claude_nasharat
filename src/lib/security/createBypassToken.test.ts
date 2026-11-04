import { describe, expect, it } from "vitest";
import { createBypassToken } from "./createBypassToken";

describe("createBypassToken", () => {
  it("creates a 3-part dot-separated token", () => {
    const token = createBypassToken("test-secret", 1700000000000);
    const parts = token.split(".");
    expect(parts.length).toBe(3);
    expect(parts[0].length).toBe(32); // 16 bytes hex = 32 chars
    expect(parts[1]).toBe("1700000000"); // seconds
    expect(parts[2].length).toBe(64); // sha256 hex = 64 chars
  });

  it("produces distinct nonces on successive calls", () => {
    const token1 = createBypassToken("test-secret", 1700000000000);
    const token2 = createBypassToken("test-secret", 1700000000000);
    expect(token1).not.toBe(token2);
  });
});
