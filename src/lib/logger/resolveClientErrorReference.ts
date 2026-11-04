import { createCorrelationId } from "./createCorrelationId";

const references = new WeakMap<object, string>();

/**
 * The reference code shown to the user for one error object.
 *
 * Stable across re-renders: the first call stores an id against the error, and
 * later calls (the effect that reports it, a second render) return the same one.
 * A server-rendered error already carries React's digest, which is also the id
 * the server logged, so that wins.
 */
export function resolveClientErrorReference(error: unknown): string {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest?: unknown }).digest ?? "")
      : "";

  if (digest) return digest;
  if (typeof error !== "object" || error === null) return createCorrelationId("cli");

  const existing = references.get(error);
  if (existing) return existing;

  const created = createCorrelationId("cli");
  references.set(error, created);
  return created;
}
