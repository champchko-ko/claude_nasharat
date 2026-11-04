import { createServerClient } from "@supabase/ssr";
import { type NextRequest, type NextResponse } from "next/server";
import { getClientEnv } from "@/lib/env";

/**
 * Refresh the Supabase auth cookies inside the Proxy and persist any rotated
 * tokens onto the outgoing response (finding N3). Without this, the access and
 * refresh tokens issued during sign-in are never renewed, so a session dies at
 * JWT expiry (`jwt_expiry = 3600`) and the auth cookies lose their max-age.
 *
 * Kept free of `next/headers`/`server-only` so it can run in the Proxy runtime;
 * the response object is mutated in place and returned for convenience.
 */
export async function refreshSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  const env = getClientEnv();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // `getUser()` validates the token against Supabase Auth and, when the access
  // token is expired, rotates it through `setAll` above.
  await supabase.auth.getUser();
  return response;
}
