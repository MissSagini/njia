import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

const TONES = {
  cream: "",
  white: "bg-white",
  ink: "bg-ink text-cream",
} as const;

type SectionProps = {
  /** Plain Cream and White sections alternate, with at most one Ink band per page. */
  tone?: keyof typeof TONES;
  /** Stack children with the standard section gap (24px mobile, 40px desktop). */
  stack?: boolean;
  /** Overrides the default 40px / 96px vertical padding. */
  padding?: string;
  className?: string;
  children: ReactNode;
};

/** Full-width colour band with content contained to 1280px. */
export function Section({ tone = "cream", stack, padding = "py-10 lg:py-24", className, children }: SectionProps) {
  return (
    <section className={TONES[tone]}>
      <div className={cx("mx-auto max-w-app px-5 lg:px-10", padding, stack && "flex flex-col gap-6 lg:gap-10", className)}>
        {children}
      </div>
    </section>
  );
}

/** Underlined Forest text link at the end of a section, with a 44px touch target. */
export function SectionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center self-start rounded-sm">
      {children}
    </Link>
  );
}

/** Section heading with an optional intro paragraph. */
export function SectionIntro({ title, onDark, children }: { title: ReactNode; onDark?: boolean; children?: ReactNode }) {
  return (
    <div className="flex max-w-[640px] flex-col gap-3">
      <h2 className="m-0 type-title text-pretty">{title}</h2>
      {children ? <p className={cx("m-0 text-body-lg", onDark ? "text-cream" : "text-ink-muted")}>{children}</p> : null}
    </div>
  );
}
