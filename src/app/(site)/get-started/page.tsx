import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton, SkeletonBlock } from "@/components/ui/Skeleton";
import { START_PATHS } from "@/lib/goals";
import { tryPublicEnv } from "@/lib/env";
import { activePackage, openCallSlots, type CallSlot, type PackageSummary } from "./data";
import { GetStartedForm } from "./GetStartedForm";

export const metadata: Metadata = {
  title: "Get started",
  description: "Tell us your goals, then book a free call or apply now.",
};

export default function GetStartedPage({ searchParams }: PageProps<"/get-started">) {
  return (
    <section className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-5 py-10 lg:px-10 lg:py-16">
      <div className="flex flex-col gap-3">
        <h1 className="m-0 type-display text-pretty">Your path starts here.</h1>
        <p className="m-0 text-body-lg text-ink-muted">
          Tell us where you want to go and what you need. It takes about 5 minutes.
        </p>
      </div>
      <Suspense fallback={<FormSkeleton />}>
        <GetStarted searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function GetStarted({ searchParams }: Pick<PageProps<"/get-started">, "searchParams">) {
  const { path } = await searchParams;
  await connection();

  let slots: CallSlot[] | null = null;
  let pkg: PackageSummary | null = null;
  if (tryPublicEnv()) {
    try {
      [slots, pkg] = await Promise.all([openCallSlots(), activePackage()]);
    } catch {
      console.error("get-started: couldn't load call times");
    }
  }

  return (
    <GetStartedForm
      initialPath={path === "apply" ? START_PATHS.apply : START_PATHS.call}
      slots={slots}
      pkg={pkg && { name: pkg.name, priceKes: pkg.priceKes, weeks: pkg.weeks }}
    />
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SkeletonBlock className="h-32 rounded-md" />
        <SkeletonBlock className="h-32 rounded-md" />
      </div>
      <Skeleton label="Loading the form" rows={4} />
    </div>
  );
}
