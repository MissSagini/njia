"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { homeFor, isRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

/**
 * Completes an emailed link: setting a first password (invite) or a forgotten
 * one (recovery). It runs on a button press rather than when the page loads,
 * so email security scanners that open links can't use it up.
 */
export async function confirmLink(formData: FormData) {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "recovery") as EmailOtpType;
  const code = String(formData.get("code") ?? "");

  const supabase = await createClient();
  const { data, error } = tokenHash
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { data: { user: null }, error: new Error("missing token") };

  const role = data.user?.app_metadata?.role;
  if (error || !isRole(role)) redirect("/log-in?error=link");
  redirect(type === "recovery" || type === "invite" || code ? "/set-password" : homeFor(role));
}
