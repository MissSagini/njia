import type { Metadata } from "next";
import Link from "next/link";
import { AdminPage, Detail, LoadError, Panel, StudentStatus } from "@/components/admin/AdminPage";
import { CallEditor } from "@/components/admin/CallEditor";
import { PairForm } from "@/components/admin/PairForm";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { studentDetail } from "@/lib/admin/data";
import { requireViewer } from "@/lib/auth/dal";
import { formatKenyanPhone } from "@/lib/goals";
import { formatKes } from "@/lib/money";
import { formatLongDayEat, formatTimeEat } from "@/lib/time";

export const metadata: Metadata = { title: "Student" };

export default function AdminStudentPage({ params }: PageProps<"/admin/students/[studentId]">) {
  return (
    <AdminPage loading="Loading the student">
      <Student params={params} />
    </AdminPage>
  );
}

async function Student({ params }: Pick<PageProps<"/admin/students/[studentId]">, "params">) {
  const { studentId } = await params;
  const viewer = await requireViewer(["admin"]);
  let detail;
  try {
    detail = /^[0-9a-f-]{36}$/i.test(studentId) ? await studentDetail(viewer, studentId) : null;
  } catch (error) {
    console.error("admin: student failed", (error as { code?: string }).code);
    return <LoadError what="This student" />;
  }
  if (!detail) {
    return (
      <EmptyState icon="graduation-cap" title="We couldn't find this student." action={<Link href="/admin/students">Back to students</Link>}>
        They may have been removed.
      </EmptyState>
    );
  }

  const { student: s, enrolment, mentor, calls } = detail;
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/students" className="inline-flex min-h-11 items-center gap-1 self-start rounded-sm">
        <Icon name="chevron-left" size={18} />
        All students
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 type-title">{s.fullName}</h1>
        <StudentStatus mentorName={mentor?.fullName ?? null} balanceKes={enrolment?.balanceKes ?? 0} hasEnrolment={!!enrolment} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Mentor" description={mentor ? `Paired with ${mentor.fullName}. ${detail.sessionsHeld} sessions held.` : "Not paired yet."}>
          {enrolment ? (
            <PairForm studentId={s.id} currentMentorId={mentor?.id ?? null} mentors={detail.approvedMentors} unpaid={enrolment.balanceKes > 0} />
          ) : (
            <p className="m-0 text-body text-ink-muted">This student has no enrolment, so they can&apos;t be paired.</p>
          )}
        </Panel>

        <Panel title="Package" description={enrolment ? `${enrolment.packageName}, ${enrolment.weeks} weeks` : undefined}>
          {enrolment ? (
            <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail label="Price">{formatKes(enrolment.priceKes)}</Detail>
              <Detail label="Still to pay">{enrolment.balanceKes ? formatKes(enrolment.balanceKes) : "Paid in full"}</Detail>
              <Detail label="Start path">{s.startPath === "free_call" ? "Free call first" : "Applied now"}</Detail>
              <Detail label="Paired">{enrolment.pairedAt ? formatLongDayEat(enrolment.pairedAt) : "Not yet"}</Detail>
            </dl>
          ) : (
            <p className="m-0 text-body text-ink-muted">No enrolment.</p>
          )}
        </Panel>
      </div>

      <Panel title="Goals">
        <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Course">{s.courseInterest}</Detail>
          <Detail label="Exams">{s.examType}</Detail>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <dt className="text-small font-semibold text-ink-muted">Dream universities</dt>
            <dd className="m-0 flex flex-wrap gap-2">
              {s.dreamUniversities.map((u) => (
                <Badge key={u} variant="tag">
                  {u}
                </Badge>
              ))}
            </dd>
          </div>
          <Detail label="Wants help with" wide>
            {s.helpNeeded}
          </Detail>
        </dl>
      </Panel>

      <Panel title="Contact">
        <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Email">
            <a href={`mailto:${s.email}`}>{s.email}</a>
          </Detail>
          <Detail label="Phone">
            <a href={`https://wa.me/${s.phone.replace(/\D/g, "")}`}>{formatKenyanPhone(s.phone)}</a>
          </Detail>
          <Detail label="School">{s.school ?? "Not given"}</Detail>
          <Detail label="Parent or guardian">
            {s.parentName}, <a href={`mailto:${s.parentEmail}`}>{s.parentEmail}</a>
          </Detail>
        </dl>
      </Panel>

      <Panel title="Free calls" description="Times in East Africa Time.">
        {calls.length ? (
          <ul className="m-0 flex list-none flex-col gap-6 p-0">
            {calls.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
                <strong>
                  {formatLongDayEat(c.startsAt)}, {formatTimeEat(c.startsAt)}
                </strong>
                <CallEditor consultationId={c.id} meetLink={c.meetLink} status={c.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-body text-ink-muted">No free call booked.</p>
        )}
      </Panel>
    </div>
  );
}
