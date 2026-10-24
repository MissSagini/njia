import "server-only";
import { resendEnv } from "@/lib/env";

export class EmailError extends Error {}

/** Sends one email through Resend's API. Throws EmailError with Resend's reason if it's refused. */
export async function sendEmail(input: { to: string; subject: string; html: string; text: string; replyTo?: string }) {
  const env = resendEnv();
  if (!env) throw new EmailError("Email isn't set up (RESEND_API_KEY)");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [env.EMAIL_REDIRECT_TO ?? input.to],
      subject: env.EMAIL_REDIRECT_TO ? `[to ${input.to}] ${input.subject}` : input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    // Resend's message is about the request (sender, domain, limits), not the recipient's data
    throw new EmailError(`Resend refused the email (${res.status}): ${body.message ?? "no message"}`);
  }
  return (await res.json()) as { id: string };
}
