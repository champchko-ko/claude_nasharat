import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { extractBypassPayload } from "./extractBypassPayload";

describe("extractBypassPayload", () => {
  it("extracts secret and clear from query params", async () => {
    const req = new NextRequest("http://localhost:3000/api/bypass?secret=foo&clear=1");
    const payload = await extractBypassPayload(req);
    expect(payload.secret).toBe("foo");
    expect(payload.clear).toBe(true);
  });

  it("extracts secret from header when query secret is absent", async () => {
    const req = new NextRequest("http://localhost:3000/api/bypass", {
      headers: { "x-bypass-secret": "header-secret" },
    });
    const payload = await extractBypassPayload(req);
    expect(payload.secret).toBe("header-secret");
    expect(payload.clear).toBe(false);
  });

  it("extracts secret and clear from POST JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/bypass", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: "body-secret", clear: true }),
    });
    const payload = await extractBypassPayload(req);
    expect(payload.secret).toBe("body-secret");
    expect(payload.clear).toBe(true);
  });
});
