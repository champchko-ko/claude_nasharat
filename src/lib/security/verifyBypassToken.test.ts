import { describe, expect, it } from "vitest";
import { createBypassToken } from "./createBypassToken";
import { verifyBypassToken } from "./verifyBypassToken";

describe("verifyBypassToken", () => {
  const secret = "correct-bypass-secret";
  const now = 1700000000000;

  it("returns true for a valid, fresh token", () => {
    const token = createBypassToken(secret, now);
    expect(verifyBypassToken(token, secret, 3600, now)).toBe(true);
  });

  it("returns false when secret or token is missing", () => {
    expect(verifyBypassToken(undefined, secret)).toBe(false);
    expect(verifyBypassToken("token", undefined)).toBe(false);
    expect(verifyBypassToken("", secret)).toBe(false);
  });

  it("returns false for a forged signature", () => {
    const token = createBypassToken(secret, now);
    const parts = token.split(".");
    const forgedToken = `${parts[0]}.${parts[1]}.forgedsignature1234567890`;
    expect(verifyBypassToken(forgedToken, secret, 3600, now)).toBe(false);
  });

  it("returns false when signed with a different secret", () => {
    const token = createBypassToken("other-secret", now);
    expect(verifyBypassToken(token, secret, 3600, now)).toBe(false);
  });

  it("returns false when token is expired", () => {
    const token = createBypassToken(secret, now);
    const futureNow = now + 4000 * 1000; // 4000 seconds later, maxAge 3600
    expect(verifyBypassToken(token, secret, 3600, futureNow)).toBe(false);
  });

  it("returns false for malformed tokens", () => {
    expect(verifyBypassToken("invalid.token", secret)).toBe(false);
    expect(verifyBypassToken("a.notanumber.signature", secret)).toBe(false);
  });
});
