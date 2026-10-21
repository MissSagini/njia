import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { publicEnv } from "@/lib/env";

/** Supabase client acting as the signed-in user, for auth calls in Server Components and Server Actions. */
export async function createClient() {
  // Read cookies first: it marks the caller as request-time, so nothing below runs during prerendering.
  // connection() also keeps it out of cookie-aware prefetch prerenders, because Supabase
  // checks token expiry against the current time.
  const cookieStore = await cookies();
  await connection();
  const env = publicEnv();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can't set cookies; the proxy refreshes the session instead
        }
      },
    },
  });
}
