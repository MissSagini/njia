import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SessionsView } from "@/components/sessions/SessionsView";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireViewer } from "@/lib/auth/dal";
import { mentees, menteeSessions } from "@/lib/sessions/data";
import { StudentSwitcher } from "./StudentSwitcher";

export const metadata: Metadata = { title: "Sessions" };

export default function MenteePage({ params }: PageProps<"/students/[studentId]">) {
  return (
    <section className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-5 py-8 lg:px-10 lg:py-12">
      <Link href="/students" className="inline-flex min-h-11 items-center gap-1 self-start rounded-sm">
        <Icon name="chevron-left" size={18} />
        My students
      </Link>
      <Suspense fallback={<Skeleton label="Loading sessions" rows={3} />}>
        <Mentee params={params} />
      </Suspense>
    </section>
  );
}

async function Mentee({ params }: Pick<PageProps<"/students/[studentId]">, "params">) {
  const { studentId } = await params;
  const viewer = await requireViewer(["mentor"]);

  let list, data;
  try {
    list = await mentees(viewer);
    // Only students paired with this mentor: RLS returns nothing for anyone else
    data = list?.students.some((s) => s.studentId === studentId) ? await menteeSessions(viewer, studentId) : null;
  } catch (error) {
    console.error("mentee: load failed", (error as { code?: string }).code);
    return <Banner tone="error">These sessions didn&apos;t load. Refresh the page to try again.</Banner>;
  }
  if (!list || !data) {
    return (
      <EmptyState icon="users" title="This student isn't on your list.">
        Go back to My students to choose one of your students.
      </EmptyState>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="m-0 type-title">{data.student.fullName}</h1>
        {list.students.length > 1 ? <StudentSwitcher students={list.students} current={studentId} /> : null}
      </div>
      <SessionsView data={data} mode="mentor" timeZone={list.timeZone} />
    </>
  );
}
