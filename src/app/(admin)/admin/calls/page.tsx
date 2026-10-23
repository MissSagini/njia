import type { Metadata } from "next";
import Link from "next/link";
import { AdminPage, LoadError, Panel } from "@/components/admin/AdminPage";
import { CallEditor } from "@/components/admin/CallEditor";
import { CallTimesForm, RemoveCallTime } from "@/components/admin/CallTimesForm";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { callSlots, type CallSlotRow } from "@/lib/admin/data";
import { requireViewer } from "@/lib/auth/dal";
import { dayKeyEat, formatLongDayEat, formatTimeEat } from "@/lib/time";

export const metadata: Metadata = { title: "Calls" };

export default function AdminCallsPage() {
  return (
    <AdminPage
      title="Free calls"
      intro="Open times appear on Get started for students to book. All times are East Africa Time."
      loading="Loading call times"
    >
      <Calls />
    </AdminPage>
  );
}

async function Calls() {
  const viewer = await requireViewer(["admin"]);
  let slots;
  try {
    slots = await callSlots(viewer);
  } catch (error) {
    console.error("admin: calls failed", (error as { code?: string }).code);
    return <LoadError what="The call times" />;
  }

  // Upcoming times, plus past ones that were booked (to record how they went)
  const shown = slots.filter((s) => s.upcoming || s.booking);
  const days = new Map<string, CallSlotRow[]>();
  for (const s of shown) days.set(dayKeyEat(s.startsAt), [...(days.get(dayKeyEat(s.startsAt)) ?? []), s]);
  const open = slots.filter((s) => s.upcoming && !s.booking).length;

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Add call times" description={`${open} open ${open === 1 ? "time" : "times"} right now.`}>
        <CallTimesForm />
      </Panel>

      {days.size === 0 ? (
        <EmptyState icon="calendar" title="No call times yet.">
          Add a few above. Students can only book the free call when there are open times.
        </EmptyState>
      ) : (
        [...days.values()].map((list) => (
          <Panel key={list[0].id} title={formatLongDayEat(list[0].startsAt)}>
            <ul className="m-0 flex list-none flex-col p-0">
              {list.map((s) => (
                <li key={s.id} className="flex flex-col gap-3 border-t border-line py-3 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong>{formatTimeEat(s.startsAt)}</strong>
                      {s.booking ? (
                        <>
                          <Link href={`/admin/students/${s.booking.studentId}`}>{s.booking.studentName}</Link>
                          <span className="text-small text-ink-muted">parent: {s.booking.parentEmail}</span>
                        </>
                      ) : (
                        <Badge variant="neutral">Open</Badge>
                      )}
                    </span>
                    {s.booking ? null : <RemoveCallTime id={s.id} />}
                  </div>
                  {s.booking ? <CallEditor consultationId={s.booking.consultationId} meetLink={s.booking.meetLink} status={s.booking.status} /> : null}
                </li>
              ))}
            </ul>
          </Panel>
        ))
      )}
    </div>
  );
}
