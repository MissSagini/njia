"use client";

import { useActionState, useEffect, useState } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormGroup } from "@/components/ui/FormLayout";
import { Panel } from "@/components/ui/Panel";
import { TextInput } from "@/components/ui/TextInput";
import { formatKes } from "@/lib/money";
import { checkPayment, startPayment, type StartState } from "@/lib/payments/actions";

type Props = {
  token: string;
  amountKes: number;
  /** What happens once paid, in one sentence. */
  afterPaid: string;
};

const POLL_MS = 4000;
const GIVE_UP_MS = 3 * 60_000;

/** Pay by M-Pesa (prompt to any Kenyan phone) or card (Paystack checkout). */
export function PaymentPanel({ token, amountKes, afterPaid }: Props) {
  const [state, action, pending] = useActionState<StartState, FormData>(startPayment, {});
  const [method, setMethod] = useState<"mpesa" | "card">("mpesa");
  const [waiting, setWaiting] = useState<StartState["pending"]>();
  const [result, setResult] = useState<{ paid?: boolean; error?: string; slow?: boolean }>({});
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    setWaiting(state.pending);
    setResult(state.paid ? { paid: true } : {});
  }

  // Card: off to Paystack's checkout
  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  // M-Pesa: wait for the PIN, checking every few seconds
  useEffect(() => {
    if (!waiting) return;
    const started = Date.now();
    let stopped = false;
    const timer = setInterval(async () => {
      if (stopped) return;
      const r = await checkPayment(token, waiting.paymentId);
      if (r.status === "succeeded") {
        stopped = true;
        setWaiting(undefined);
        setResult({ paid: true });
      } else if (r.status === "failed") {
        stopped = true;
        setWaiting(undefined);
        setResult({ error: r.error ?? "The M-Pesa payment didn't go through. Try again, or pay by card." });
      } else if (Date.now() - started > GIVE_UP_MS) {
        stopped = true;
        setWaiting(undefined);
        setResult({ slow: true });
      }
    }, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [waiting, token]);

  if (result.paid) {
    return (
      <EmptyState icon="check" title="Payment received.">
        {afterPaid}
      </EmptyState>
    );
  }

  if (waiting) {
    return (
      <Panel as="div" role="status" aria-live="polite">
        <div className="flex items-center gap-3">
          <span aria-hidden className="size-5 animate-spin rounded-pill border-2 border-forest border-r-transparent" />
          <h2 className="m-0 type-heading">Check the phone ending {waiting.phoneEnding}.</h2>
        </div>
        <p className="m-0 text-body text-ink-muted">
          An M-Pesa prompt for {formatKes(amountKes)} is on its way. Enter the M-Pesa PIN to pay. This page updates by itself.
        </p>
      </Panel>
    );
  }

  const error = state.error ?? result.error;
  const busy = pending || !!state.redirectTo;

  return (
    <Panel title={`Pay ${formatKes(amountKes)}`} description="Payments are handled securely by Paystack. Njia never sees card details.">
    <form action={action} noValidate className="m-0 flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="method" value={method} />

      <FormGroup legend="How would you like to pay?" className="gap-2">
        <div className="grid grid-cols-2 gap-2">
          <ChoiceChip label="M-Pesa" selected={method === "mpesa"} onPick={() => setMethod("mpesa")} height={52} />
          <ChoiceChip label="Card" sub="Visa or Mastercard" selected={method === "card"} onPick={() => setMethod("card")} height={52} />
        </div>
      </FormGroup>

      {method === "mpesa" ? (
        <TextInput
          label="M-Pesa number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0712 345 678"
          defaultValue={state.phone}
          hint="Yours or your parent's. We'll send the M-Pesa prompt to this phone."
          error={state.fieldErrors?.phone}
        />
      ) : (
        <p className="m-0 text-body text-ink-muted">
          You&apos;ll go to Paystack to enter the card details, then come back here. Some Kenyan cards have limits below{" "}
          {formatKes(amountKes)}; if yours does, M-Pesa is the easier way.
        </p>
      )}

      {result.slow ? (
        <Banner tone="info" title="We haven't heard back yet.">
          If you entered your PIN, the payment may still come through: refresh this page in a few minutes. If not, try again.
        </Banner>
      ) : null}
      {error ? <Banner tone="error">{error}</Banner> : null}

      <Button type="submit" variant="primary" fullWidth loading={busy}>
        {method === "mpesa"
          ? busy
            ? "Sending the M-Pesa prompt…"
            : "Send the M-Pesa prompt"
          : busy
            ? "Opening Paystack…"
            : "Pay by card"}
      </Button>
    </form>
    </Panel>
  );
}
