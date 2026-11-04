/**
 * Forwards a structured error payload to an external collector.
 *
 * The sink is configuration, not code: set `ERROR_REPORTING_URL` (and
 * optionally `ERROR_REPORTING_TOKEN`) and every reported error is POSTed there.
 * With no URL the reporter stays local — console JSON only — so the app has no
 * vendor dependency and nothing silently points at someone else's endpoint.
 *
 * Never throws: losing a report must not break the request that produced it.
 */
export async function reportErrorToSink(payload: Record<string, unknown>): Promise<boolean> {
  const endpoint = process.env.ERROR_REPORTING_URL;
  if (!endpoint) return false;

  const token = process.env.ERROR_REPORTING_TOKEN;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
