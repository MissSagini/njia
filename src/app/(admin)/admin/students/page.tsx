import type { Metadata } from "next";
import Link from "next/link";
import { AdminPage, LoadError, StudentStatus } from "@/components/admin/AdminPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { allStudents } from "@/lib/admin/data";
import { requireViewer } from "@/lib/auth/dal";
import { formatDayEat, formatTimeEat } from "@/lib/time";

export const metadata: Metadata = { title: "Students" };

export default function AdminStudentsPage() {
  return (
    <AdminPage title="Students" intro="Everyone who has filled in their goals, newest first." loading="Loading students">
      <StudentList />
    </AdminPage>
  );
}

async function StudentList() {
  const viewer = await requireViewer(["admin"]);
  let students;
  try {
    students = await allStudents(viewer);
  } catch (error) {
    console.error("admin: students failed", (error as { code?: string }).code);
    return <LoadError what="The student list" />;
  }
  if (students.length === 0) {
    return (
      <EmptyState icon="graduation-cap" title="No students yet.">
        Students show here as soon as they fill in their goals on Get started.
      </EmptyState>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col overflow-hidden rounded-md border border-line bg-white p-0">
      {students.map((s) => (
        <li key={s.id} className="flex flex-col gap-2 border-t border-line px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-col">
            <Link href={`/admin/students/${s.id}`} className="font-semibold">
              {s.fullName}
            </Link>
            <span className="text-small text-ink-muted">
              {s.startPath === "free_call" ? "Free call first" : "Applied now"} · joined {formatDayEat(s.createdAt)}
              {s.nextCallAt ? ` · call ${formatDayEat(s.nextCallAt)}, ${formatTimeEat(s.nextCallAt)}` : ""}
            </span>
          </div>
          <StudentStatus mentorName={s.mentorName} balanceKes={s.balanceKes} hasEnrolment={!!s.enrolmentId} />
        </li>
      ))}
    </ul>
  );
}
