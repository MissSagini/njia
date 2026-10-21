"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TextInput } from "@/components/ui/TextInput";
import { sendResetLink, type ForgotState } from "./actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(sendResetLink, {});

  if (state.sent) {
    return (
      <div role="status" className="flex flex-col gap-6">
        <div className="flex size-16 items-center justify-center rounded-pill bg-forest-soft">
          <Icon name="mail" size={28} color="var(--color-forest)" />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="m-0 type-display">Check your email.</h1>
          <p className="m-0 text-body-lg">
            If <strong className="font-semibold">{state.email}</strong> has a Njia account, we&apos;ve sent a link to
            choose a new password. It works for 15 minutes.
          </p>
        </div>
        <p className="m-0 text-body text-ink-muted">Not there? Check your spam folder.</p>
        <Link href="/log-in" className="inline-flex min-h-11 items-center self-start rounded-sm">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="m-0 flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="m-0 type-display">Reset your password.</h1>
        <p className="m-0 text-body-lg text-ink-muted">
          Enter the email you use for Njia. We&apos;ll send you a link to choose a new password.
        </p>
      </div>
      <TextInput
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        defaultValue={state.email}
        error={state.error}
        disabled={pending}
      />
      <Button type="submit" variant="primary" fullWidth loading={pending}>
        {pending ? "Sending your link…" : "Send me a reset link"}
      </Button>
      <Link href="/log-in" className="inline-flex min-h-11 items-center self-center rounded-sm">
        Back to log in
      </Link>
    </form>
  );
}
