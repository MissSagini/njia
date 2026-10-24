import type { ReactNode } from "react";
import { Suspense } from "react";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatKes } from "@/lib/money";

/** Frame for an admin screen: title, optional intro, and the loaded content in Suspense. Without a title, the content brings its own h1. */
export function AdminPage({ title, intro, loading, children }: { title?: string; intro?: string; loading: string; children: ReactNode }) {
  return (
    <section className="mx-auto flex w-full max-w-app flex-col gap-6 px-5 py-8 lg:px-10 lg:py-12">
      {title ? (
        <div className="flex flex-col gap-2">
          <h1 className="m-0 type-title">{title}</h1>
          {intro ? <p className="m-0 max-w-[720px] text-body-lg text-ink-muted">{intro}</p> : null}
        </div>
      ) : null}
      <Suspense fallback={<Skeleton label={loading} rows={4} />}>{children}</Suspense>
    </section>
  );
}

/** Shown when an admin screen's data fails to load. */
export function LoadError({ what }: { what: string }) {
  return <Banner tone="error">{`${what} didn't load. Refresh the page to try again.`}</Banner>;
}

/** Where a student is: paired, ready to pair (paid), or still to pay. */
export function StudentStatus({
  mentorName,
  balanceKes,
  hasEnrolment,
  overdue,
}: {
  mentorName: string | null;
  balanceKes: number;
  hasEnrolment: boolean;
  /** Paid more than 2 days ago and still not paired. */
  overdue?: boolean;
}) {
  if (!hasEnrolment) return <Badge variant="neutral">No enrolment</Badge>;
  if (mentorName) return <Badge variant="tag">Paired with {mentorName.split(" ")[0]}</Badge>;
  if (overdue) return <Badge variant="dark">Overdue: pair now</Badge>;
  if (balanceKes === 0) return <Badge variant="ochre">Ready to pair</Badge>;
  return <Badge variant="neutral">{formatKes(balanceKes)} to pay</Badge>;
}

/** A labelled value in a definition list. */
export function Detail({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "flex flex-col gap-0.5 sm:col-span-2" : "flex flex-col gap-0.5"}>
      <dt className="text-small font-semibold text-ink-muted">{label}</dt>
      <dd className="m-0 text-body break-words whitespace-pre-line text-ink">{children}</dd>
    </div>
  );
}
