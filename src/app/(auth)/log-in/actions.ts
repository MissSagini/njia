"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { homeFor, isRole, safeNextPath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { email?: string; error?: string; fieldErrors?: { email?: string; password?: string } };

const credentials = z.object({
  email: z.email().transform((e) => e.trim().toLowerCase()),
  password: z.string().min(1),
});

export async function logIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const fieldErrors: LoginState["fieldErrors"] = {};
  if (!email) fieldErrors.email = "Enter your email address.";
  else if (!z.email().safeParse(email).success) fieldErrors.email = "Enter an email like cynthia@gmail.com.";
  if (!password) fieldErrors.password = "Enter your password.";
  if (fieldErrors.email || fieldErrors.password) return { email, fieldErrors };

  const parsed = credentials.parse({ email, password });
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed);

  if (error) {
    if (error.status === 429) return { email, error: "Too many attempts. Wait a few minutes, then try again." };
    // Same message whether the email exists or not, so the form can't be used to find accounts
    return { email, error: "That email and password don't match. Check them, or reset your password." };
  }

  const role = data.user.app_metadata?.role;
  if (!isRole(role)) redirect("/");
  redirect(safeNextPath(String(formData.get("next") ?? "")) ?? homeFor(role));
}
