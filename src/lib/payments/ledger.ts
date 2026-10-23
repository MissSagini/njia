import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { adminDb, schema, type Tx } from "@/db";
import type { Verified } from "./paystack";

/**
 * The payments ledger: enrolment → charges → payments. Nothing stores "paid";
 * what's owed is always charges minus succeeded payments.
 */

export type Checkout = {
  enrolmentId: string;
  studentId: string;
  firstName: string;
  email: string;
  packageName: string;
  weeks: number;
  startPath: "free_call" | "apply_now";
  /** The next charge with something left to pay, and how much. */
  charge: { id: string; remainingKes: number } | null;
  balanceKes: number;
};

/** What this enrolment still owes. Server access: callers have checked the token or session. */
export async function loadCheckout(enrolmentId: string): Promise<Checkout | null> {
  const db = adminDb();
  const enrolment = await db.query.enrolments.findFirst({ where: eq(schema.enrolments.id, enrolmentId) });
  if (!enrolment || enrolment.status === "cancelled") return null;
  const student = await db.query.students.findFirst({ where: eq(schema.students.id, enrolment.studentId) });
  if (!student) return null;

  const rows = await db
    .select({
      id: schema.charges.id,
      amountKes: schema.charges.amountKes,
      paidKes: sql<number>`coalesce((select sum(p.amount_kes) from payments p where p.charge_id = ${schema.charges.id} and p.status = 'succeeded'), 0)::int`,
    })
    .from(schema.charges)
    .where(eq(schema.charges.enrolmentId, enrolmentId))
    .orderBy(asc(schema.charges.dueOn), asc(schema.charges.createdAt));

  const open = rows.map((r) => ({ id: r.id, remainingKes: Math.max(r.amountKes - r.paidKes, 0) })).filter((r) => r.remainingKes > 0);
  return {
    enrolmentId,
    studentId: student.id,
    firstName: student.fullName.split(" ")[0],
    email: student.email,
    packageName: enrolment.packageName,
    weeks: enrolment.weeks,
    startPath: student.startPath,
    charge: open[0] ?? null,
    balanceKes: open.reduce((n, r) => n + r.remainingKes, 0),
  };
}

/** What happens next, shown once a payment has gone through. */
export function afterPaidText(startPath: "free_call" | "apply_now") {
  return startPath === "apply_now"
    ? "We'll pair you with a mentor within 2 days. Log in any time to see your mentor; if you haven't set a password yet, use “Forgot your password?” on the log in page."
    : "We'll pair you with a mentor within 2 days and email you when it's done.";
}

/** Plain-language reason for a failed payment, from Paystack's gateway response. */
export function failureMessage(method: string, gatewayResponse: string | null): string {
  const r = (gatewayResponse ?? "").toLowerCase();
  if (method === "mpesa") {
    if (r.includes("insufficient")) return "There wasn't enough in the M-Pesa account. Top up, or ask your parent to pay, then try again.";
    if (r.includes("cancel")) return "The M-Pesa prompt was cancelled. Try again when you're ready.";
    if (r.includes("timeout") || r.includes("timed out")) return "The M-Pesa prompt timed out. Try again, and enter your PIN when it appears.";
    return "The M-Pesa payment didn't go through. Try again, or pay by card.";
  }
  if (r.includes("insufficient") || r.includes("limit")) {
    return "Your bank declined the card. Many Kenyan cards have limits below this amount, so try M-Pesa or ask your bank to raise the limit.";
  }
  return "The card payment didn't go through. Try again, or pay by M-Pesa.";
}

/** After a succeeded payment: if nothing is owed any more, the enrolment becomes active. Returns whether it's fully paid. */
export async function activateIfPaid(tx: Tx, enrolment: { id: string; status: string }): Promise<boolean> {
  const [{ owed }] = await tx.execute<{ owed: number }>(sql`
    select coalesce(sum(c.amount_kes), 0)::int - coalesce((
      select sum(p.amount_kes) from payments p join charges c2 on c2.id = p.charge_id
      where c2.enrolment_id = ${enrolment.id} and p.status = 'succeeded'), 0)::int as owed
    from charges c where c.enrolment_id = ${enrolment.id}`);
  const paid = owed <= 0;
  if (paid && enrolment.status === "pending_payment") {
    await tx.update(schema.enrolments).set({ status: "active" }).where(eq(schema.enrolments.id, enrolment.id));
  }
  return paid;
}

export type Settled = { status: "succeeded" | "failed" | "pending"; failureReason?: string | null; becamePaid?: boolean };

/**
 * Records Paystack's verified result for one of our payments. Only the first
 * call moves a payment out of "pending", so webhooks, the return page and
 * polling can all call this safely.
 */
export async function settle(reference: string, verified: Verified): Promise<Settled> {
  const db = adminDb();
  const payment = await db.query.payments.findFirst({ where: eq(schema.payments.providerReference, reference) });
  if (!payment) throw new Error("unknown payment reference");
  if (payment.status !== "pending") return { status: payment.status, failureReason: payment.failureReason };

  let status: Settled["status"] = "pending";
  let failureReason: string | null = null;
  if (verified.status === "success") {
    // The amount and currency must match what we asked for, or it isn't this payment
    if (verified.currency === "KES" && verified.amount === payment.amountKes * 100) status = "succeeded";
    else {
      status = "failed";
      failureReason = "Amount or currency didn't match";
      console.error("payments: amount mismatch", reference);
    }
  } else if (["failed", "abandoned", "reversed"].includes(verified.status)) {
    status = "failed";
    failureReason = failureMessage(payment.method, verified.gateway_response);
  }
  if (status === "pending") return { status };

  const outcome = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(schema.payments)
      .set({ status, failureReason, paidAt: status === "succeeded" ? new Date(verified.paid_at ?? Date.now()) : null })
      .where(and(eq(schema.payments.id, payment.id), eq(schema.payments.status, "pending")))
      .returning({ id: schema.payments.id });
    if (!updated) return null; // Someone else settled it first

    const [charge] = await tx.select().from(schema.charges).where(eq(schema.charges.id, payment.chargeId));
    const enrolment = await tx.query.enrolments.findFirst({ where: eq(schema.enrolments.id, charge.enrolmentId) });
    if (!enrolment) return null;

    await tx.insert(schema.activityLog).values({
      studentId: enrolment.studentId,
      eventType: status === "succeeded" ? "payment_succeeded" : "payment_failed",
      details: { paymentId: payment.id, amountKes: payment.amountKes, method: payment.method },
    });

    if (status !== "succeeded") return { becamePaid: false, enrolment };
    return { becamePaid: await activateIfPaid(tx, enrolment), enrolment };
  });

  return { status, failureReason, becamePaid: outcome?.becamePaid ?? false };
}
