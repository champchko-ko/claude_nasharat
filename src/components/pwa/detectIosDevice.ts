/**
 * Detects whether the current browser client is running on an Apple iOS / iPadOS device.
 */
export function detectIosDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent || "";
  const isIosUserAgent = /iPad|iPhone|iPod/.test(userAgent);
  const isIpadDesktopMode =
    navigator.platform === "MacIntel" &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;

  return isIosUserAgent || isIpadDesktopMode;
}
