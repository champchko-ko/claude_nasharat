/**
 * Purges all CacheStorage entries and signals the active Service Worker
 * to clear any cached data upon user logout or session termination.
 * Prevents data leakage between users on shared devices.
 */
export async function purgeClientCaches(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_USER_CACHE" });
    }

    if (typeof window.caches !== "undefined" && typeof window.caches?.keys === "function") {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
    }
  } catch (error) {
    // Graceful fallback to avoid blocking the logout workflow if cache clearing fails
    console.warn("[PWA] Error purging client caches:", error);
  }
}
