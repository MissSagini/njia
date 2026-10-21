import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

/** Minimal frame for log in and 2FA: logo and a way back home. */
export default function AuthLayout({ children }: { children: ReactNode }) {
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
      <main className="mx-auto w-full flex-1 px-5 pt-6 pb-10 sm:max-w-[560px] sm:px-0 sm:pt-18 sm:pb-24">
        <div className="sm:rounded-md sm:border sm:border-line sm:bg-white sm:p-12">{children}</div>
      </main>
    </>
  );
}
