import { describe, it, expect, afterEach } from "vitest";
import { detectIosDevice } from "./detectIosDevice";

describe("detectIosDevice", () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("returns true for iPhone user agent", () => {
    Object.defineProperty(global, "navigator", {
      value: {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)",
        platform: "iPhone",
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });

    expect(detectIosDevice()).toBe(true);
  });

  it("returns true for iPad user agent", () => {
    Object.defineProperty(global, "navigator", {
      value: {
        userAgent: "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X)",
        platform: "iPad",
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });

    expect(detectIosDevice()).toBe(true);
  });

  it("returns true for modern iPad desktop mode (MacIntel with touch points)", () => {
    Object.defineProperty(global, "navigator", {
      value: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        platform: "MacIntel",
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });

    expect(detectIosDevice()).toBe(true);
  });

  it("returns false for macOS desktop (MacIntel with 0 touch points)", () => {
    Object.defineProperty(global, "navigator", {
      value: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        platform: "MacIntel",
        maxTouchPoints: 0,
      },
      writable: true,
      configurable: true,
    });

    expect(detectIosDevice()).toBe(false);
  });

  it("returns false for Android user agent", () => {
    Object.defineProperty(global, "navigator", {
      value: {
        userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7)",
        platform: "Linux armv8l",
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });

    expect(detectIosDevice()).toBe(false);
  });
});
