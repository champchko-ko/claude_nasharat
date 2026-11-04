import { reportClientError } from "@/lib/logger/reportClientError";

// Runs before hydration (Next.js `instrumentation-client` contract), so a crash
// during boot is still reported. The error boundaries report the same failures;
// `reportClientError` de-duplicates inside a short window.
window.addEventListener("error", (event) => {
  reportClientError(event.error ?? event.message, "error");
});

window.addEventListener("unhandledrejection", (event) => {
  reportClientError(event.reason, "unhandledrejection");
});
