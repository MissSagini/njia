import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
});

function fail(error: z.ZodError): never {
  const names = error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(`Missing or invalid environment variables: ${names}. Copy .env.example to .env.local and fill it in.`);
}

function parsePublic() {
  // Listed one by one so Next.js can inline them into client bundles
  return publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  });
}

/** Values safe to use in the browser and the proxy. */
export function publicEnv() {
  const parsed = parsePublic();
  return parsed.success ? parsed.data : fail(parsed.error);
}

/** Like publicEnv, but null instead of throwing, so public pages still load before Supabase is configured. */
export function tryPublicEnv() {
  const parsed = parsePublic();
  return parsed.success ? parsed.data : null;
}

const googleSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REFRESH_TOKEN: z.string().min(1),
  GOOGLE_CALENDAR_ID: z.string().min(1).default("primary"),
});

/** Google Calendar access, or null until it's connected (npm run google:connect). */
export function googleEnv() {
  const parsed = googleSchema.safeParse({ ...process.env, GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID || undefined });
  return parsed.success ? parsed.data : null;
}

/** Paystack (M-Pesa and cards), or null until the secret key is set. Test keys start sk_test_. */
export function paystackEnv() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  return key ? { PAYSTACK_SECRET_KEY: key, live: key.startsWith("sk_live_") } : null;
}

/**
 * Resend, for emails Njia sends itself (the weekly parent report), or null until
 * the API key is set. Until a domain is verified, Resend only delivers from its
 * test sender to the account owner's own address.
 */
export function resendEnv() {
  const key = process.env.RESEND_API_KEY;
  return key ? { RESEND_API_KEY: key, EMAIL_FROM: process.env.EMAIL_FROM || "Njia <onboarding@resend.dev>" } : null;
}

/** Shared secret Vercel Cron sends as "Authorization: Bearer …", or null if unset. */
export function cronSecret() {
  return process.env.CRON_SECRET || null;
}

/** Server-only values, including secrets. */
export function serverEnv() {
  const parsed = serverSchema.safeParse({ ...process.env, NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined });
  return parsed.success ? parsed.data : fail(parsed.error);
}
