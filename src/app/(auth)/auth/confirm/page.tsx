import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { confirmLink } from "./actions";

export const metadata: Metadata = { title: "Choose your password" };

export default function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  return (
    <Suspense>
      <Confirm searchParams={searchParams} />
    </Suspense>
  );
}

async function Confirm({ searchParams }: { searchParams: PageProps<"/auth/confirm">["searchParams"] }) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const tokenHash = first(params.token_hash);
  const type = first(params.type) || "recovery";
  const code = first(params.code);

  if (!tokenHash && !code) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="m-0 type-display">This link isn&apos;t complete.</h1>
        <p className="m-0 text-body-lg text-ink-muted">Open the link from your email again, or ask for a new one.</p>
        <Link href="/forgot-password" className="inline-flex min-h-11 items-center self-start rounded-sm">
          Get a new link
        </Link>
      </div>
    );
  }

  return (
    <form action={confirmLink} className="m-0 flex flex-col gap-6">
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="code" value={code} />
      <div className="flex size-16 items-center justify-center rounded-pill bg-forest-soft">
        <Icon name="lock" size={28} color="var(--color-forest)" />
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="m-0 type-display">One more tap.</h1>
        <p className="m-0 text-body-lg text-ink-muted">Press the button to continue and choose your password.</p>
      </div>
      <Button type="submit" variant="primary" fullWidth iconRight="arrow-right">
        Continue
      </Button>
    </form>
  );
}
