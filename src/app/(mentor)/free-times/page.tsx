import type { Metadata } from "next";
import { Suspense } from "react";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireViewer } from "@/lib/auth/dal";
import { myFreeTimes } from "@/lib/sessions/data";
import { FreeTimes } from "./FreeTimes";

export const metadata: Metadata = { title: "Free times" };

export default function FreeTimesPage() {
  return (
    <section className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-5 py-8 lg:px-10 lg:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="m-0 type-title">Free times</h1>
        <p className="m-0 text-body-lg text-ink-muted">
          Add times you&apos;re free for a 1-hour session. Your students book their next session from these.
        </p>
      </div>
      <Suspense fallback={<Skeleton label="Loading your free times" rows={3} />}>
        <Loaded />
      </Suspense>
    </section>
  );
}

async function Loaded() {
  const viewer = await requireViewer(["mentor"]);
  let data;
  try {
    data = await myFreeTimes(viewer);
  } catch (error) {
    console.error("free-times: load failed", (error as { code?: string }).code);
    return <Banner tone="error">Your free times didn&apos;t load. Refresh the page to try again.</Banner>;
  }
  if (!data) {
    return (
      <EmptyState icon="user" title="Your mentor profile isn't set up yet.">
        The Njia team will finish it soon. Message hello@njia.co.ke if it&apos;s taking a while.
      </EmptyState>
    );
  }
  return <FreeTimes timeZone={data.timeZone} times={data.times} />;
}
