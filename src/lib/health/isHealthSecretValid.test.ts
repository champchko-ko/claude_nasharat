import { describe, expect, it } from "vitest";
import { isHealthSecretValid } from "./isHealthSecretValid";

describe("isHealthSecretValid", () => {
  it("returns false if expectedSecret is undefined or empty", () => {
    const req = new Request("http://localhost:3000/api/health", {
      headers: { authorization: "Bearer token" },
    });
    expect(isHealthSecretValid(req, undefined)).toBe(false);
    expect(isHealthSecretValid(req, "")).toBe(false);
  });

  it("returns false if authorization header is missing or not a Bearer token", () => {
    const reqNoHeader = new Request("http://localhost:3000/api/health");
    expect(isHealthSecretValid(reqNoHeader, "secret")).toBe(false);

    const reqBasic = new Request("http://localhost:3000/api/health", {
      headers: { authorization: "Basic secret" },
    });
    expect(isHealthSecretValid(reqBasic, "secret")).toBe(false);
  });

  it("returns true when Bearer token matches secret", () => {
    const req = new Request("http://localhost:3000/api/health", {
      headers: { authorization: "Bearer matching-secret" },
    });
    expect(isHealthSecretValid(req, "matching-secret")).toBe(true);
  });

  it("returns false when Bearer token does not match secret", () => {
    const req = new Request("http://localhost:3000/api/health", {
      headers: { authorization: "Bearer invalid-token" },
    });
    expect(isHealthSecretValid(req, "matching-secret")).toBe(false);
  });
});
