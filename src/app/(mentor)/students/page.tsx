import type { Metadata } from "next";
import { Suspense } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { initialsFor, requireViewer } from "@/lib/auth/dal";
import { mentees } from "@/lib/sessions/data";
import { formatDay, formatTime, zoneLabel } from "@/lib/time";

export const metadata: Metadata = { title: "My students" };

export default function StudentsPage() {
  return (
    <section className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-5 py-8 lg:px-10 lg:py-12">
      <h1 className="m-0 type-title">My students</h1>
      <Suspense fallback={<Skeleton label="Loading your students" rows={2} />}>
        <StudentList />
      </Suspense>
    </section>
  );
}

async function StudentList() {
  const viewer = await requireViewer(["mentor"]);
  let data;
  try {
    data = await mentees(viewer);
  } catch (error) {
    console.error("students: load failed", (error as { code?: string }).code);
    return <Banner tone="error">Your students didn&apos;t load. Refresh the page to try again.</Banner>;
  }
  if (!data) {
    return (
      <EmptyState icon="user" title="Your mentor profile isn't set up yet.">
        The Njia team will finish it soon. Message hello@njia.co.ke if it&apos;s taking a while.
      </EmptyState>
    );
  }
  if (data.students.length === 0) {
    return (
      <EmptyState icon="users" title="No students yet.">
        We&apos;ll email you when we pair you with a student. Meanwhile, add your free times so they can book straight away.
      </EmptyState>
    );
  }

  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
      {data.students.map((s) => (
        <li key={s.studentId}>
          <Card interactive href={`/students/${s.studentId}`} className="h-full">
            <div className="flex items-center gap-4">
              <Avatar initials={initialsFor(s.fullName, "")} size={48} tone="soft" />
              <div className="flex flex-col">
                <span className="font-heading text-[22px] leading-[30px] font-semibold text-ink">{s.fullName}</span>
                <span className="text-body text-ink-muted">
                  {s.nextSessionAt
                    ? `Next session ${formatDay(s.nextSessionAt, data.timeZone)}, ${formatTime(s.nextSessionAt, data.timeZone)} ${zoneLabel(s.nextSessionAt, data.timeZone)}`
                    : "No session booked"}
                </span>
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
