import type { Metadata } from "next";
import Link from "next/link";
import { AdminPage, Detail, LoadError, Panel, StudentStatus } from "@/components/admin/AdminPage";
import { CallEditor } from "@/components/admin/CallEditor";
import { CopyLink } from "@/components/admin/CopyLink";
import { SendReportTest } from "@/components/admin/ReportButtons";
import { ContactDetails, RecordPaymentForm } from "@/components/admin/StudentForms";
import { PairForm } from "@/components/admin/PairForm";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { studentDetail } from "@/lib/admin/data";
import { requireViewer } from "@/lib/auth/dal";
import { serverEnv } from "@/lib/env";
import { formatKes } from "@/lib/money";
import { payPath } from "@/lib/payments/link";
import { buildWeeklyReport, renderWeeklyReport } from "@/lib/reports/weekly";
import { formatLongDayEat, formatTimeEat } from "@/lib/time";

export const metadata: Metadata = { title: "Student" };

const METHOD_LABELS: Record<string, string> = { mpesa: "M-Pesa", card: "Card", bank_transfer: "Bank transfer", cash: "Cash" };
const STATUS_LABELS: Record<string, string> = { succeeded: "Paid", pending: "Waiting", failed: "Failed" };

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
        <StudentStatus mentorName={mentor?.fullName ?? null} balanceKes={enrolment?.balanceKes ?? 0} hasEnrolment={!!enrolment} overdue={enrolment?.overdue} />
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
            <div className="flex flex-col gap-4">
              <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Detail label="Price">{formatKes(enrolment.priceKes)}</Detail>
                <Detail label="Still to pay">{enrolment.balanceKes ? formatKes(enrolment.balanceKes) : "Paid in full"}</Detail>
                <Detail label="Start path">{s.startPath === "free_call" ? "Free call first" : "Applied now"}</Detail>
                <Detail label="Paired">{enrolment.pairedAt ? formatLongDayEat(enrolment.pairedAt) : "Not yet"}</Detail>
                {enrolment.balanceKes > 0 ? (
                  <div className="flex flex-col gap-3 sm:col-span-2">
                    <CopyLink url={`${serverEnv().NEXT_PUBLIC_SITE_URL}${payPath(enrolment.id)}`} label="Copy payment link" />
                    <RecordPaymentForm studentId={s.id} balanceKes={enrolment.balanceKes} />
                  </div>
                ) : null}
              </dl>
              {detail.payments.length ? (
                <div className="flex flex-col gap-1">
                  <h3 className="m-0 text-[15px] leading-[22px] font-semibold">Payments</h3>
                  <ul className="m-0 flex list-none flex-col p-0">
                    {detail.payments.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2 first:border-t-0">
                        <span className="text-body">
                          {formatKes(p.amountKes)} · {METHOD_LABELS[p.method] ?? p.method}
                          <span className="block text-small text-ink-muted">
                            {formatLongDayEat(p.at)}
                            {p.recorded ? ` · recorded by the team${p.note ? `: ${p.note}` : ""}` : ""}
                          </span>
                        </span>
                        <Badge variant={p.status === "succeeded" ? "tag" : "neutral"}>{STATUS_LABELS[p.status] ?? p.status}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
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
        <ContactDetails
          studentId={s.id}
          contact={{ fullName: s.fullName, email: s.email, phone: s.phone, school: s.school, parentName: s.parentName, parentEmail: s.parentEmail }}
        />
      </Panel>

      <WeeklyReportPreview studentId={s.id} firstName={s.fullName.split(" ")[0]} />

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

/** What this week's parent report would say, as text, with a way to send it to yourself. */
async function WeeklyReportPreview({ studentId, firstName }: { studentId: string; firstName: string }) {
  const report = await buildWeeklyReport(studentId).catch(() => null);
  return (
    <Panel title="Weekly parent report" description={report ? `What ${report.parentName} would get this week.` : undefined}>
      {report ? (
        <>
          <pre className="m-0 rounded-md border border-line bg-cream p-4 font-body text-small whitespace-pre-wrap text-ink">
            {renderWeeklyReport(report).text}
          </pre>
          <SendReportTest studentId={studentId} />
        </>
      ) : (
        <p className="m-0 text-body text-ink-muted">Reports start once {firstName} has paid and been paired with a mentor.</p>
      )}
    </Panel>
  );
}
