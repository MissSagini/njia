/**
 * Opens a "choose a new password" page for an account, without sending any
 * email. For when Supabase's email limit blocks "Forgot your password?". The
 * link is opened in your browser and never printed.
 *
 *   npm run user:password-link -- --email you@example.com
 */
import { execFile } from "node:child_process";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";

const { values } = parseArgs({ options: { email: { type: "string" } } });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!values.email) {
  console.error("Usage: npm run user:password-link -- --email you@example.com");
  process.exit(1);
}
if (!url || !secret) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
  process.exit(1);
}

const supabase = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
const { data, error } = await supabase.auth.admin.generateLink({ type: "recovery", email: values.email.trim().toLowerCase() });
if (error || !data.properties?.hashed_token) {
  console.error(`Couldn't make a link (${error?.message ?? "no token"}). Check the email is right.`);
  process.exit(1);
}

// Our own confirm page, which needs a button press before it uses the link
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const link = `${site}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery`;
execFile("open", [link], (e) => {
  if (e) console.error("Couldn't open the browser. Run this again from a Mac terminal.");
});
console.log("Opened a page in your browser to choose a new password. It works once, for about an hour.");
