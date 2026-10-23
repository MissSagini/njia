import type { Metadata } from "next";
import Link from "next/link";
import { AdminPage, LoadError, Panel, StudentStatus } from "@/components/admin/AdminPage";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { allMentors, allStudents, callSlots, PAIRING_DAYS } from "@/lib/admin/data";
import { requireViewer } from "@/lib/auth/dal";
import { formatDayEat, formatTimeEat } from "@/lib/time";

export const metadata: Metadata = { title: "Admin" };

export default function AdminOverviewPage() {
  return (
    <AdminPage title="Overview" intro="What needs doing: students to pair, free calls coming up and mentors to approve." loading="Loading the overview">
      <Overview />
    </AdminPage>
  );
}

async function Overview() {
  const viewer = await requireViewer(["admin"]);
  let students, slots, mentors;
  try {
    [students, slots, mentors] = await Promise.all([allStudents(viewer), callSlots(viewer), allMentors(viewer)]);
  } catch (error) {
    console.error("admin: overview failed", (error as { code?: string }).code);
    return <LoadError what="The overview" />;
  }

  // Overdue first, then paid and waiting, then those still to pay
  const rank = (s: (typeof students)[number]) => (s.overdue ? 0 : s.balanceKes === 0 ? 1 : 2);
  const unpaired = students.filter((s) => s.enrolmentId && !s.mentorName).sort((a, b) => rank(a) - rank(b));
  const overdue = unpaired.filter((s) => s.overdue);
  const booked = slots.filter((s) => s.booking?.status === "booked" && s.upcoming);
  const calls = booked.slice(0, 6);
  const waiting = mentors.filter((m) => !m.approved);

  return (
    <div className="flex flex-col gap-6">
      {overdue.length ? (
        <Banner tone="error" title={`${overdue.length} paid ${overdue.length === 1 ? "student has" : "students have"} waited more than ${PAIRING_DAYS} days for a mentor.`}>
          We promise to pair within {PAIRING_DAYS} days of payment. Pair them today:{" "}
          {overdue.map((s, i) => (
            <span key={s.id}>
              {i ? ", " : ""}
              <Link href={`/admin/students/${s.id}`}>{s.fullName}</Link>
            </span>
          ))}
          .
        </Banner>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Waiting for a mentor" value={unpaired.length} href="/admin/students" />
        <Stat label="Free calls booked" value={booked.length} href="/admin/calls" />
        <Stat label="Mentors to approve" value={waiting.length} href="/admin/mentors" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Waiting for a mentor" description="Pair paid students within 2 days.">
          {unpaired.length ? (
            <ul className="m-0 flex list-none flex-col p-0">
              {unpaired.map((s) => (
                <li key={s.id} className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-t border-line py-2 first:border-t-0">
                  <Link href={`/admin/students/${s.id}`}>{s.fullName}</Link>
                  <span className="flex flex-wrap items-center gap-2">
                    {s.paidAt && !s.overdue ? (
                      <span className="text-small text-ink-muted">pair by {formatDayEat(new Date(new Date(s.paidAt).getTime() + PAIRING_DAYS * 86_400_000))}</span>
                    ) : null}
                    <StudentStatus mentorName={null} balanceKes={s.balanceKes} hasEnrolment overdue={s.overdue} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="users" title="Everyone is paired.">New students show here once they sign up.</EmptyState>
          )}
        </Panel>

        <Panel title="Next free calls" description="Times in East Africa Time.">
          {calls.length ? (
            <ul className="m-0 flex list-none flex-col p-0">
              {calls.map((c) => (
                <li key={c.id} className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-t border-line py-2 first:border-t-0">
                  <Link href={`/admin/students/${c.booking!.studentId}`}>{c.booking!.studentName}</Link>
                  <span className="text-body text-ink-muted">
                    {formatDayEat(c.startsAt)}, {formatTimeEat(c.startsAt)}
                    {c.booking!.meetLink ? "" : " · no Meet link yet"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="calendar" title="No free calls booked.">
              Make sure there are open times on the Calls page.
            </EmptyState>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="flex flex-col gap-1 rounded-md border border-line bg-white p-4 text-ink no-underline hover:border-ink-muted hover:no-underline sm:p-6">
      <span className="type-label text-forest">{label}</span>
      <span className="font-heading text-[32px] leading-10 font-semibold">{value}</span>
    </Link>
  );
}
