/**
 * Creates a login for a person and emails them a link to choose their
 * password. The database trigger adds their profile with the given role. Use it to create the first admin; students and mentors will
 * normally be created by the app (goals form, admin adding a mentor).
 *
 *   npm run user:create -- --email you@example.com --name "Your Name" --role admin
 */
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    role: { type: "string", default: "admin" },
  },
});

const roles = ["student", "mentor", "admin"];
if (!values.email || !values.role || !roles.includes(values.role)) {
  console.error('Usage: npm run user:create -- --email you@example.com --name "Your Name" --role admin|mentor|student');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
  process.exit(1);
}

const supabase = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });

const { data, error } = await supabase.auth.admin.createUser({
  email: values.email.trim().toLowerCase(),
  email_confirm: true,
  // app_metadata can only be set with the secret key, so users can't change their own role
  app_metadata: { role: values.role },
  user_metadata: { full_name: values.name ?? null },
});

if (error) {
  console.error(`Could not create the user: ${error.message}`);
  process.exit(1);
}

// Uses the "Reset password" email template, which links to /auth/confirm → /set-password
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const { error: mailError } = await supabase.auth.resetPasswordForEmail(data.user.email!, { redirectTo: `${site}/auth/confirm` });

console.log(`Created ${values.role} ${data.user.email}.`);
console.log(
  mailError
    ? `Couldn't send the password email (${mailError.message}). They can use "Forgot your password?" on /log-in.`
    : "Sent them an email with a link to choose their password.",
);
