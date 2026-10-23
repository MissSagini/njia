"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq, gt } from "drizzle-orm";
import { adminDb, schema } from "@/db";
import { paystackEnv, serverEnv } from "@/lib/env";
import { normaliseKenyanPhone } from "@/lib/goals";
import { enrolmentFromToken } from "./link";
import { failureMessage, loadCheckout, settle } from "./ledger";
import { chargeMpesa, startCardCheckout, verifyTransaction } from "./paystack";

/**
 * Payments are started with a payment link token (see link.ts), so a parent
 * can pay without an account. The token only allows paying this enrolment.
 */

export type StartState = {
  error?: string;
  fieldErrors?: { phone?: string };
  phone?: string;
  /** M-Pesa: wait for the customer to enter their PIN. */
  pending?: { paymentId: string; phoneEnding: string };
  /** Card: go to Paystack's checkout. */
  redirectTo?: string;
  paid?: boolean;
};

const SOMETHING_WRONG = "We couldn't start the payment. Please try again in a few minutes.";
/** Stops a payment link being used to send prompt after prompt. */
const RESEND_AFTER_SECONDS = 90;

export async function startPayment(_prev: StartState, formData: FormData): Promise<StartState> {
  const enrolmentId = enrolmentFromToken(String(formData.get("token") ?? ""));
  const method = formData.get("method") === "card" ? "card" : "mpesa";
  const rawPhone = String(formData.get("phone") ?? "");
  if (!enrolmentId) return { error: "This payment link isn't valid. Ask the Njia team for a new one." };
  if (!paystackEnv()) return { error: "Payments aren't switched on yet. We'll email you how to pay." };

  const phone = method === "mpesa" ? normaliseKenyanPhone(rawPhone) : null;
  if (method === "mpesa" && !phone) {
    return { phone: rawPhone, fieldErrors: { phone: rawPhone.trim() ? "Enter a Kenyan M-Pesa number, like 0712 345 678." : "Enter the M-Pesa number to send the prompt to." } };
  }

  const checkout = await loadCheckout(enrolmentId);
  if (!checkout) return { error: "This payment link isn't valid. Ask the Njia team for a new one." };
  if (!checkout.charge) return { paid: true };

  const db = adminDb();
  const recent = await db
    .select({ id: schema.payments.id })
    .from(schema.payments)
    .where(
      and(
        eq(schema.payments.chargeId, checkout.charge.id),
        eq(schema.payments.status, "pending"),
        eq(schema.payments.method, "mpesa"),
        gt(schema.payments.createdAt, new Date(Date.now() - RESEND_AFTER_SECONDS * 1000)),
      ),
    )
    .orderBy(desc(schema.payments.createdAt))
    .limit(1);
  if (method === "mpesa" && recent.length) {
    return { phone: rawPhone, error: "We've just sent an M-Pesa prompt. Check the phone, or wait a minute and try again." };
  }

  const reference = `njia_${randomUUID()}`;
  const [payment] = await db
    .insert(schema.payments)
    .values({
      chargeId: checkout.charge.id,
      amountKes: checkout.charge.remainingKes,
      method,
      mpesaPhone: phone,
      providerReference: reference,
    })
    .returning({ id: schema.payments.id });

  try {
    if (method === "card") {
      const { authorization_url } = await startCardCheckout({
        reference,
        email: checkout.email,
        amountKes: checkout.charge.remainingKes,
        callbackUrl: `${serverEnv().NEXT_PUBLIC_SITE_URL}/pay/return`,
      });
      return { redirectTo: authorization_url };
    }

    const result = await chargeMpesa({ reference, email: checkout.email, amountKes: checkout.charge.remainingKes, phone: phone! });
    if (result.status === "success") {
      const settled = await settle(reference, await verifyTransaction(reference));
      return settled.status === "succeeded" ? { paid: true } : { phone: rawPhone, error: settled.failureReason ?? SOMETHING_WRONG };
    }
    if (result.status === "failed") {
      await db.update(schema.payments).set({ status: "failed", failureReason: result.gateway_response }).where(eq(schema.payments.id, payment.id));
      return { phone: rawPhone, error: failureMessage("mpesa", result.gateway_response ?? null) };
    }
    return { phone: rawPhone, pending: { paymentId: payment.id, phoneEnding: phone!.slice(-3) } };
  } catch (error) {
    console.error("payments: start failed", (error as Error).message);
    await db
      .update(schema.payments)
      .set({ status: "failed", failureReason: "Couldn't start with Paystack" })
      .where(and(eq(schema.payments.id, payment.id), eq(schema.payments.status, "pending")));
    return { phone: rawPhone, error: SOMETHING_WRONG };
  }
}

export type CheckResult = { status: "pending" | "succeeded" | "failed"; error?: string };

/** Polled while an M-Pesa prompt is open. Asks Paystack directly if no webhook has arrived yet. */
export async function checkPayment(token: string, paymentId: string): Promise<CheckResult> {
  const enrolmentId = enrolmentFromToken(token);
  if (!enrolmentId || !/^[0-9a-f-]{36}$/i.test(paymentId)) return { status: "failed", error: SOMETHING_WRONG };

  const db = adminDb();
  const [row] = await db
    .select({ payment: schema.payments, enrolmentId: schema.charges.enrolmentId })
    .from(schema.payments)
    .innerJoin(schema.charges, eq(schema.charges.id, schema.payments.chargeId))
    .where(eq(schema.payments.id, paymentId));
  if (!row || row.enrolmentId !== enrolmentId) return { status: "failed", error: SOMETHING_WRONG };

  const { payment } = row;
  if (payment.status !== "pending") return { status: payment.status, error: payment.failureReason ?? undefined };
  if (!payment.providerReference || Date.now() - payment.createdAt.getTime() < 10_000) return { status: "pending" };

  try {
    const settled = await settle(payment.providerReference, await verifyTransaction(payment.providerReference));
    return { status: settled.status, error: settled.failureReason ?? undefined };
  } catch (error) {
    console.error("payments: check failed", (error as Error).message);
    return { status: "pending" };
  }
}
