import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { purgeClientCaches } from "./purgeClientCaches";

describe("purgeClientCaches", () => {
  const originalCaches = window.caches;
  const originalNavigator = window.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, "caches", {
      value: originalCaches,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("deletes all caches in CacheStorage and sends CLEAR_USER_CACHE to serviceWorker", async () => {
    const postMessageMock = vi.fn();
    const deleteMock = vi.fn().mockResolvedValue(true);
    const keysMock = vi.fn().mockResolvedValue(["cache-v1", "cache-v2"]);

    Object.defineProperty(window, "caches", {
      value: {
        keys: keysMock,
        delete: deleteMock,
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, "navigator", {
      value: {
        serviceWorker: {
          controller: {
            postMessage: postMessageMock,
          },
        },
      },
      writable: true,
      configurable: true,
    });

    await purgeClientCaches();

    expect(postMessageMock).toHaveBeenCalledWith({ type: "CLEAR_USER_CACHE" });
    expect(keysMock).toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalledWith("cache-v1");
    expect(deleteMock).toHaveBeenCalledWith("cache-v2");
  });

  it("handles missing caches or serviceWorker gracefully without throwing", async () => {
    Object.defineProperty(window, "caches", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, "navigator", {
      value: {},
      writable: true,
      configurable: true,
    });

    await expect(purgeClientCaches()).resolves.toBeUndefined();
  });

  it("catches cache deletion errors without failing", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    Object.defineProperty(window, "caches", {
      value: {
        keys: vi.fn().mockRejectedValue(new Error("Storage locked")),
        delete: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    await expect(purgeClientCaches()).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith("[PWA] Error purging client caches:", expect.any(Error));
  });
});
