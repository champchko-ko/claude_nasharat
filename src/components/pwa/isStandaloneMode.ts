/**
 * Detects whether the web app is already running in standalone display mode (installed PWA).
 */
export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const isStandaloneMedia =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(display-mode: standalone)").matches
      : false;
  const isNavigatorStandalone = Boolean(
    (window.navigator as unknown as { standalone?: boolean })?.standalone,
  );

  return isStandaloneMedia || isNavigatorStandalone;
}
