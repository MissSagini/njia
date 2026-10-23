import type { Metadata } from "next";
import { Suspense } from "react";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireViewer } from "@/lib/auth/dal";
import { myGoals } from "@/lib/students/goals";
import { GoalsForm } from "./GoalsForm";

export const metadata: Metadata = { title: "My goals" };

export default function MyGoalsPage() {
  return (
    <section className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-5 py-8 lg:px-10 lg:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="m-0 type-title">My goals</h1>
        <p className="m-0 text-body-lg text-ink-muted">Plans change, and that&apos;s fine. Your mentor sees any change straight away.</p>
      </div>
      <Suspense fallback={<Skeleton label="Loading your goals" rows={4} />}>
        <Loaded />
      </Suspense>
    </section>
  );
}

async function Loaded() {
  const viewer = await requireViewer(["student"]);
  let goals;
  try {
    goals = await myGoals(viewer);
  } catch (error) {
    console.error("my-goals: load failed", (error as { code?: string }).code);
    return <Banner tone="error">Your goals didn&apos;t load. Refresh the page to try again.</Banner>;
  }
  if (!goals) {
    return (
      <EmptyState icon="compass" title="We couldn't find your goals.">
        Message us at hello@njia.co.ke and we&apos;ll sort it out.
      </EmptyState>
    );
  }
  return <GoalsForm goals={goals} />;
}
