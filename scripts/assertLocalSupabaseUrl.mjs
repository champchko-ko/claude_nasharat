const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "0.0.0.0"]);

/**
 * Refuses any URL that is not the local loopback interface.
 *
 * The RLS battery writes fixtures, uploads storage objects and deletes rows. It
 * must never be pointed at a hosted project again.
 */
export function assertLocalSupabaseUrl(url) {
  if (!url) {
    throw new Error("The local stack did not report an API URL. Refusing to run.");
  }

  const host = new URL(url).hostname;
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error(
      `Refusing to run a destructive local script against non-local host: ${host}. ` +
        "Use `npm run test:rls` / `npm run storage:sweep`, which read the local stack credentials.",
    );
  }

  return url;
}
