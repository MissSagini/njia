"use server";

import { z } from "zod";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type ForgotState = { email?: string; error?: string; sent?: boolean };

/** Emails a link to choose a new password. Says "sent" whether or not the account exists. */
export async function sendResetLink(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const raw = String(formData.get("email") ?? "").trim();
  if (!raw) return { error: "Enter your email address." };
  const parsed = z.email().safeParse(raw);
  if (!parsed.success) return { email: raw, error: "Enter an email like cynthia@gmail.com." };
  const email = parsed.data.toLowerCase();

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${publicEnv().NEXT_PUBLIC_SITE_URL}/auth/confirm`,
  });
  if (error?.status === 429) return { email, error: "You've asked for a few links in a row. Wait a minute, then try again." };

  return { email, sent: true };
}
