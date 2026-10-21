"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/dal";
import { homeFor, MIN_PASSWORD_LENGTH } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type SetPasswordState = { error?: string; confirmError?: string };

/** Saves a new password for the signed-in user (after an invite or reset link). */
export async function setPassword(_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in?error=link");

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters. A short sentence you'll remember works well.` };
  }
  if (password !== confirm) return { confirmError: "The two passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: "That's your current password. Choose a new one." };
    if (error.code === "weak_password") return { error: "That password is too easy to guess. Choose a longer one." };
    return { error: "We couldn't save your password just now. Try again in a moment." };
  }

  redirect(homeFor(viewer.role));
}
