import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { footerColumns } from "@/lib/navigation";

const linkClasses = "inline-block py-1 text-[15px] leading-[22px] font-normal text-cream no-underline hover:underline";

/** Ink footer: dark lockup, Fraunces tagline, Ochre column labels, Cream links. */
export function SiteFooter() {
  return (
    <footer className="bg-ink font-body text-cream">
      <div className="mx-auto flex max-w-site flex-col gap-8 px-5 pt-10 pb-6 lg:gap-12 lg:px-10 lg:pt-16 lg:pb-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-10">
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
            <Logo variant="dark" width={120} />
            <p className="m-0 max-w-[280px] font-heading text-[20px] leading-7 font-semibold">
              Someone from home who&apos;s already been there.
            </p>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title} className="flex flex-col gap-1.5">
              <div className="mb-1.5 type-label text-ochre">{col.title}</div>
              {col.links.map((l) =>
                l.href.startsWith("/") ? (
                  <Link key={l.label} href={l.href} className={linkClasses}>
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.label} href={l.href} className={linkClasses}>
                    {l.label}
                  </a>
                ),
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-hairline-dark pt-6 text-small text-cream">
          <span>hello@njia.co.ke · Nairobi, Kenya</span>
          <span>© 2026 Njia. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
