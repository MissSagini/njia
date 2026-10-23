import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

/** Minimal frame for paying: logo and a way back home, nothing to distract from the payment. */
export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="mx-auto flex h-[60px] w-full max-w-app items-center justify-between px-5 lg:h-[72px] lg:px-10">
        <Link href="/" aria-label="Njia home" className="flex min-h-11 items-center rounded-sm">
          <span className="lg:hidden">
            <Logo width={88} priority />
          </span>
          <span className="hidden lg:block">
            <Logo width={112} priority />
          </span>
        </Link>
        <Link href="/" className="flex min-h-11 items-center rounded-sm px-2">
          Back to home
        </Link>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
