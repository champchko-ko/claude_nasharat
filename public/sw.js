/**
 * Service Worker for School Administration Portal PWA
 * Caching Strategy:
 * - Network-Only with Offline Fallback for HTML navigations (NEVER cache dynamic/authenticated pages)
 * - Stale-While-Revalidate for static assets, scripts, and fonts (_next/static, public static icons/css)
 * - Network-Only for Supabase API calls, auth endpoints, mutations, and storage assets
 */

const CACHE_NAME = "school-portal-cache-v3";
const OFFLINE_URL = "/offline.html";

// Pre-cached assets during installation (strictly static, unauthenticated assets)
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon.svg",
  "/offline.html",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-512x512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Explicit cache clearing upon logout or session invalidation
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_USER_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) =>
        Promise.all(cacheNames.map((name) => caches.delete(name))),
      ),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests, API endpoints, Supabase backend calls, and storage assets
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/storage/") ||
    url.hostname.includes("supabase.co")
  ) {
    return;
  }

  // 2. HTML Document Navigations: Network-Only with Offline Fallback
  // NEVER cache HTML responses to prevent data leakage of authenticated pages
  // (dashboard, circulars, maintenance, reports, settings) on shared devices.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offlineFallback = await caches.match(OFFLINE_URL);
        if (offlineFallback) {
          return offlineFallback;
        }
        return new Response(
          "<!DOCTYPE html><html lang='ar' dir='rtl'><head><meta charset='UTF-8'><title>لا يوجد اتصال</title></head><body style='font-family:system-ui;text-align:center;padding:2rem'><h2>لا يوجد اتصال بالإنترنت</h2><p>يرجى التحقق من اتصال الشبكة وإعادة المحاولة.</p></body></html>",
          { headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      }),
    );
    return;
  }

  // 3. Static Assets (_next/static, public static images, fonts): Stale-While-Revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2|woff|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      }),
    );
  }
});

