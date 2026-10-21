"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/roles";
import { setPassword, type SetPasswordState } from "./actions";

export function SetPasswordForm() {
  const [state, action, pending] = useActionState<SetPasswordState, FormData>(setPassword, {});

  return (
    <form action={action} noValidate className="m-0 flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="m-0 type-display">Choose your password.</h1>
        <p className="m-0 text-body-lg text-ink-muted">You&apos;ll use it with your email each time you log in.</p>
      </div>
      <div className="flex flex-col gap-4">
        <TextInput
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={state.error}
          disabled={pending}
        />
        <TextInput
          label="Type it again"
          name="confirm"
          type="password"
          autoComplete="new-password"
          error={state.confirmError}
          disabled={pending}
        />
      </div>
      <Button type="submit" variant="primary" fullWidth loading={pending}>
        {pending ? "Saving your password…" : "Save my password"}
      </Button>
    </form>
  );
}
