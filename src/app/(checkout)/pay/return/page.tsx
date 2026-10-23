import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminDb, schema } from "@/db";
import { afterPaidText, settle } from "@/lib/payments/ledger";
import { payPath } from "@/lib/payments/link";
import { verifyTransaction } from "@/lib/payments/paystack";

export const metadata: Metadata = { title: "Payment", robots: { index: false, follow: false } };

/** Where Paystack's card checkout sends people back to. Confirms with Paystack before saying anything. */
export default function PayReturnPage({ searchParams }: PageProps<"/pay/return">) {
  return (
    <section className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-5 py-10 lg:px-10 lg:py-16">
      <Suspense fallback={<Skeleton label="Checking your payment" rows={2} />}>
        <Result searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Result({ searchParams }: Pick<PageProps<"/pay/return">, "searchParams">) {
  const params = await searchParams;
  await connection();
  const reference = String(params.reference ?? params.trxref ?? "");
  if (!reference.startsWith("njia_")) return <Unknown />;

  const [row] = await adminDb()
    .select({ payment: schema.payments, enrolmentId: schema.charges.enrolmentId, startPath: schema.students.startPath })
    .from(schema.payments)
    .innerJoin(schema.charges, eq(schema.charges.id, schema.payments.chargeId))
    .innerJoin(schema.enrolments, eq(schema.enrolments.id, schema.charges.enrolmentId))
    .innerJoin(schema.students, eq(schema.students.id, schema.enrolments.studentId))
    .where(eq(schema.payments.providerReference, reference));
  if (!row) return <Unknown />;

  let status = row.payment.status;
  let reason = row.payment.failureReason;
  if (status === "pending") {
    try {
      const settled = await settle(reference, await verifyTransaction(reference));
      status = settled.status;
      reason = settled.failureReason ?? null;
    } catch (error) {
      console.error("pay return: verify failed", (error as Error).message);
    }
  }

  const back = payPath(row.enrolmentId);
  if (status === "succeeded") {
    return (
      <EmptyState icon="check" title="Payment received." headingLevel="h1">
        {afterPaidText(row.startPath)}
      </EmptyState>
    );
  }
  if (status === "failed") {
    return (
      <EmptyState
        icon="credit-card"
        title="The payment didn't go through."
        headingLevel="h1"
        action={
          <Button variant="primary" href={back}>
            Try again
          </Button>
        }
      >
        {reason ?? "The card payment didn't go through. Try again, or pay by M-Pesa."}
      </EmptyState>
    );
  }
  return (
    <EmptyState
      icon="clock"
      title="We're still checking your payment."
      headingLevel="h1"
      action={
        <Button variant="secondary" href={back}>
          Back to the payment page
        </Button>
      }
    >
      This can take a minute. Refresh this page shortly. If you were charged, it will show as paid.
    </EmptyState>
  );
}

function Unknown() {
  return (
    <EmptyState icon="credit-card" title="We couldn't find that payment." headingLevel="h1">
      If you were charged, message us at hello@njia.co.ke with the time you paid and we&apos;ll sort it out.
    </EmptyState>
  );
}
