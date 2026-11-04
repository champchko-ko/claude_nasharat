export type ClientErrorPayload = {
  message: string;
  correlationId: string;
  url: string;
  stack?: string;
  source: string;
};

/**
 * Posts one browser error to `/api/client-errors`.
 *
 * `sendBeacon` is preferred because the page may be unloading or the user may
 * be navigating away; the `fetch(keepalive)` fallback covers browsers without
 * it. Both are fire-and-forget by design — reporting must never block or break
 * the error screen.
 */
export function sendClientErrorReport(payload: ClientErrorPayload): void {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/client-errors", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/client-errors", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
