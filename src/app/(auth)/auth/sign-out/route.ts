import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Clears a session whose account no longer exists (or has no profile), then
 * goes to log in. Without this, the proxy (trusting the still-valid token) and
 * the page (finding no account) would redirect each other forever.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/log-in", request.url));
}
