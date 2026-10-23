import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { paystackEnv } from "@/lib/env";

/**
 * Paystack's REST API, for M-Pesa prompts (Charge API, mobile money) and card
 * payments (hosted checkout). Amounts go to Paystack in cents (shillings × 100).
 */

const API = "https://api.paystack.co";

export class PaystackError extends Error {}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const env = paystackEnv();
  if (!env) throw new PaystackError("Paystack isn't set up");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || !body.status || !body.data) {
    // Paystack's message describes the request, not the customer, so it's safe to log
    throw new PaystackError(`Paystack ${path.split("?")[0]} failed (${res.status}): ${body.message ?? "no message"}`);
  }
  return body.data;
}

/** Sends an M-Pesa prompt to the phone. The result arrives by webhook, or by verifying later. */
export async function chargeMpesa(input: { reference: string; email: string; amountKes: number; phone: string }) {
  return call<{ status: string; reference: string; display_text?: string; gateway_response?: string }>("/charge", {
    method: "POST",
    body: JSON.stringify({
      reference: input.reference,
      email: input.email,
      amount: input.amountKes * 100,
      currency: "KES",
      mobile_money: { phone: input.phone, provider: "mpesa" },
    }),
  });
}

/** Starts a card payment on Paystack's hosted checkout. Card details never reach Njia. */
export async function startCardCheckout(input: { reference: string; email: string; amountKes: number; callbackUrl: string }) {
  return call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      reference: input.reference,
      email: input.email,
      amount: input.amountKes * 100,
      currency: "KES",
      channels: ["card"],
      callback_url: input.callbackUrl,
    }),
  });
}

export type Verified = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  channel: string;
  gateway_response: string | null;
};

/** The transaction as Paystack has it: the only source we trust for "paid". */
export function verifyTransaction(reference: string) {
  return call<Verified>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Checks a webhook's x-paystack-signature: HMAC-SHA512 of the raw body with the secret key. */
export function validSignature(rawBody: string, signature: string | null): boolean {
  const env = paystackEnv();
  if (!env || !signature) return false;
  const expected = createHmac("sha512", env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
