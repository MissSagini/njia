import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SessionsView } from "@/components/sessions/SessionsView";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireViewer } from "@/lib/auth/dal";
import { mentees, menteeSessions } from "@/lib/sessions/data";
import { menteeGoals, type StudentGoals } from "@/lib/students/goals";
import { formatLongDay } from "@/lib/time";
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

  let list, data, goals;
  try {
    list = await mentees(viewer);
    // Only students paired with this mentor: RLS returns nothing for anyone else
    const paired = list?.students.some((s) => s.studentId === studentId);
    [data, goals] = paired ? await Promise.all([menteeSessions(viewer, studentId), menteeGoals(viewer, studentId)]) : [null, null];
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
      {goals ? <Goals goals={goals} timeZone={list.timeZone} /> : null}
      <SessionsView data={data} mode="mentor" timeZone={list.timeZone} />
    </>
  );
}

/** What the student is aiming for. They edit it on My goals, so it's always current. */
function Goals({ goals, timeZone }: { goals: StudentGoals; timeZone: string }) {
  return (
    <Panel title="Goals" action={<span className="text-small text-ink-muted">Updated {formatLongDay(goals.updatedAt, timeZone)}</span>}>
      <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-0.5">
          <dt className="text-small font-semibold text-ink-muted">Course</dt>
          <dd className="m-0 text-body">{goals.courseInterest}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-small font-semibold text-ink-muted">Exams</dt>
          <dd className="m-0 text-body">{goals.examType}</dd>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <dt className="text-small font-semibold text-ink-muted">Dream universities</dt>
          <dd className="m-0 flex flex-wrap gap-2">
            {goals.dreamUniversities.map((u) => (
              <Badge key={u} variant="tag">
                {u}
              </Badge>
            ))}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:col-span-2">
          <dt className="text-small font-semibold text-ink-muted">Wants help with</dt>
          <dd className="m-0 text-body whitespace-pre-line">{goals.helpNeeded}</dd>
        </div>
      </dl>
    </Panel>
  );
}
