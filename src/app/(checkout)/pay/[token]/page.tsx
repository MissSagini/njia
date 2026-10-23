import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PackageSummaryCard } from "@/components/payments/PackageSummaryCard";
import { PaymentPanel } from "@/components/payments/PaymentPanel";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatKes } from "@/lib/money";
import { afterPaidText, loadCheckout } from "@/lib/payments/ledger";
import { enrolmentFromToken } from "@/lib/payments/link";

export const metadata: Metadata = {
  title: "Payment",
  // A payment link is private to the family it was sent to
  robots: { index: false, follow: false },
};

export default function PayPage({ params }: PageProps<"/pay/[token]">) {
  return (
    <section className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-5 py-10 lg:px-10 lg:py-16">
      <Suspense fallback={<Skeleton label="Loading the payment" rows={3} />}>
        <Pay params={params} />
      </Suspense>
    </section>
  );
}

async function Pay({ params }: Pick<PageProps<"/pay/[token]">, "params">) {
  const { token } = await params;
  await connection();
  const enrolmentId = enrolmentFromToken(decodeURIComponent(token));
  if (!enrolmentId) return <InvalidLink />;

  let checkout;
  try {
    checkout = await loadCheckout(enrolmentId);
  } catch (error) {
    console.error("pay: load failed", (error as { code?: string }).code);
    return <Banner tone="error">The payment page didn&apos;t load. Refresh the page to try again.</Banner>;
  }
  if (!checkout) return <InvalidLink />;

  const afterPaid = afterPaidText(checkout.startPath);

  return (
    <>
      <div className="flex flex-col gap-3">
        <h1 className="m-0 type-display text-pretty">One last step, {checkout.firstName}.</h1>
        <p className="m-0 text-body-lg text-ink-muted">
          {checkout.charge ? `Pay ${formatKes(checkout.balanceKes)} for your ${checkout.weeks}-week mentorship.` : "Everything is paid."}
        </p>
      </div>
      {checkout.charge ? (
        <>
          <PackageSummaryCard pkg={{ priceKes: checkout.balanceKes, weeks: checkout.weeks }} />
          <PaymentPanel token={decodeURIComponent(token)} amountKes={checkout.charge.remainingKes} afterPaid={afterPaid} />
        </>
      ) : (
        <EmptyState icon="check" title="Payment received.">
          {afterPaid}
        </EmptyState>
      )}
    </>
  );
}

function InvalidLink() {
  return (
    <EmptyState icon="credit-card" title="This payment link isn't valid." headingLevel="h1">
      Check you copied the whole link, or message us at hello@njia.co.ke for a new one.
    </EmptyState>
  );
}
