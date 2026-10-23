import type { Metadata } from "next";
import { Suspense } from "react";
import { SessionsView } from "@/components/sessions/SessionsView";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireViewer } from "@/lib/auth/dal";
import { studentSessions } from "@/lib/sessions/data";
import { EAT } from "@/lib/time";

export const metadata: Metadata = { title: "Sessions" };

export default function SessionsPage() {
  return (
    <section className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-5 py-8 lg:px-10 lg:py-12">
      <h1 className="m-0 type-title">Sessions</h1>
      <Suspense fallback={<Skeleton label="Loading your sessions" rows={3} />}>
        <StudentSessions />
      </Suspense>
    </section>
  );
}

async function StudentSessions() {
  const viewer = await requireViewer(["student"]);
  let data;
  try {
    data = await studentSessions(viewer);
  } catch (error) {
    console.error("sessions: load failed", (error as { code?: string }).code);
    return <Banner tone="error">Your sessions didn&apos;t load. Refresh the page to try again.</Banner>;
  }
  if (!data) {
    return (
      <EmptyState icon="compass" title="We couldn't find your goals.">
        Message us at hello@njia.co.ke and we&apos;ll sort it out.
      </EmptyState>
    );
  }
  return <SessionsView data={data} mode="student" timeZone={EAT} />;
}
