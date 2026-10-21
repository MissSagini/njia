"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { logIn, type LoginState } from "./actions";

const notices: Record<string, { tone: "error" | "success"; text: string }> = {
  link: { tone: "error", text: "That link has expired or was already used. Use “Forgot your password?” to get a new one." },
};

export function LoginForm() {
  const params = useSearchParams();
  const notice = notices[params.get("error") ?? params.get("notice") ?? ""];
  const [state, action, pending] = useActionState<LoginState, FormData>(logIn, {});

  return (
    <form action={action} noValidate className="m-0 flex flex-col gap-6">
      <input type="hidden" name="next" value={params.get("next") ?? ""} />
      <div className="flex flex-col gap-3">
        <h1 className="m-0 type-display">Welcome back.</h1>
        <p className="m-0 text-body-lg text-ink-muted">Log in with your email and password.</p>
      </div>
      {state.error ? (
        <Banner tone="error">{state.error}</Banner>
      ) : notice ? (
        <Banner tone={notice.tone}>{notice.text}</Banner>
      ) : null}
      <div className="flex flex-col gap-4">
        <TextInput
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          defaultValue={state.email}
          error={state.fieldErrors?.email}
          disabled={pending}
          hint="Students and mentors both log in here."
        />
        <TextInput
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          error={state.fieldErrors?.password}
          disabled={pending}
        />
        <Link href="/forgot-password" className="inline-flex min-h-11 items-center self-start rounded-sm">
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" variant="primary" fullWidth loading={pending}>
        {pending ? "Logging you in…" : "Log in"}
      </Button>
      <div className="flex flex-col items-center gap-1">
        <span className="text-body text-ink-muted">New to Njia?</span>
        <Link href="/get-started?path=call" className="inline-flex min-h-11 items-center rounded-sm">
          Book a free call or apply
        </Link>
      </div>
    </form>
  );
}
