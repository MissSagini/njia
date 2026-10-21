import { createServerClient } from "@supabase/ssr";
import type { JwtPayload } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { tryPublicEnv } from "@/lib/env";
import { areaFor, homeFor, isRole } from "@/lib/auth/roles";

/**
 * Refreshes the Supabase session cookie on every request and does a first,
 * fast check on signed-in areas. Each area's layout checks again on the
 * server (src/lib/auth/dal.ts), so this is not the only lock.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = tryPublicEnv();

  let claims: JwtPayload | undefined;
  if (env) {
    const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    // Verifies the JWT and refreshes it if needed. Don't put code between client creation and this call.
    const { data } = await supabase.auth.getClaims();
    claims = data?.claims;
  }
  const role = isRole(claims?.app_metadata?.role) ? claims.app_metadata.role : null;

  const { pathname, search } = request.nextUrl;

  const redirect = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url));
    // Keep any refreshed session cookies on the redirect
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (pathname === "/log-in" && role) return redirect(homeFor(role));
  if (pathname === "/set-password" && !role) return redirect("/log-in");

  const area = areaFor(pathname);
  if (area) {
    if (!role) return redirect(`/log-in?next=${encodeURIComponent(pathname + search)}`);
    if (!area.roles.includes(role)) return redirect(homeFor(role));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
