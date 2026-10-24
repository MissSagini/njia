import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { adminDb, schema } from "@/db";
import { resendEnv, serverEnv } from "@/lib/env";
import { formatKes } from "@/lib/money";
import { loadCheckout } from "@/lib/payments/ledger";
import { payPath } from "@/lib/payments/link";
import { formatLongDayEat, formatTimeEat } from "@/lib/time";
import { renderEmail } from "./layout";
import { sendEmail } from "./send";

/**
 * The emails Njia sends when something happens: a free call's Meet link, a new
 * pairing, a nudge to pay after the free call, and the daily list of overdue
 * pairings for the team. Each returns what happened instead of throwing, so the
 * action that triggered it still succeeds if email fails. Server access: callers
 * have checked permission (admin action or cron).
 */

export type Sent = { sent: number; errors: string[] };

const site = () => serverEnv().NEXT_PUBLIC_SITE_URL;
const first = (name: string) => name.split(" ")[0];

async function deliver(messages: { to: string; subject: string; html: string; text: string }[]): Promise<Sent> {
  const result: Sent = { sent: 0, errors: [] };
  if (!resendEnv()) return { sent: 0, errors: ["Email isn't set up (RESEND_API_KEY)"] };
  for (const m of messages) {
    try {
      await sendEmail(m);
      result.sent++;
    } catch (error) {
      // The reason only: no names or addresses in logs
      const reason = (error as Error).message;
      if (!result.errors.includes(reason)) result.errors.push(reason);
      console.error("email: send failed", reason);
    }
  }
  return result;
}

async function logEvent(studentId: string, eventType: string, details: Record<string, unknown>, actorProfileId?: string) {
  await adminDb().insert(schema.activityLog).values({ studentId, eventType, details, actorProfileId });
}

// ---------------------------------------------------------------- free call link

/** Emails the free call's Meet link to the student and their parent. */
export async function sendCallLink(consultationId: string, actorProfileId?: string): Promise<Sent> {
  const db = adminDb();
  const [row] = await db
    .select({ call: schema.consultations, startsAt: schema.consultationSlots.startsAt, student: schema.students })
    .from(schema.consultations)
    .innerJoin(schema.consultationSlots, eq(schema.consultationSlots.id, schema.consultations.slotId))
    .innerJoin(schema.students, eq(schema.students.id, schema.consultations.studentId))
    .where(eq(schema.consultations.id, consultationId));
  if (!row?.call.meetLink) return { sent: 0, errors: ["This call has no Meet link yet"] };

  const { student, startsAt } = row;
  const when = `${formatLongDayEat(startsAt)} at ${formatTimeEat(startsAt)} EAT`;
  const rows: [string, string][] = [
    ["When", when],
    ["How long", "30 minutes"],
  ];
  const button = { label: "Join on Google Meet", url: row.call.meetLink };
  const footer = `You're getting this because ${first(student.fullName)} booked a free call with Njia.`;

  const toStudent = renderEmail({
    eyebrow: "Your free call",
    title: "Here's the link for your free call.",
    paragraphs: [`Hi ${first(student.fullName)}, we're looking forward to talking about your goals and your universities.`],
    rows,
    button,
    after: ["Your parent or guardian is welcome to join. We've sent them the link too."],
    footer,
  });
  const toParent = renderEmail({
    eyebrow: "Free call",
    title: `Join ${first(student.fullName)}'s free call.`,
    paragraphs: [
      `Hi ${first(student.parentName)}, ${first(student.fullName)} has booked a free call with Njia to talk through their goals and how a mentor can help. You're welcome to join.`,
    ],
    rows,
    button,
    footer: `You're getting this because ${first(student.fullName)} named you as their parent or guardian on Njia.`,
  });

  const subject = `Free call: ${formatLongDayEat(startsAt)}, ${formatTimeEat(startsAt)} EAT`;
  const result = await deliver([
    { to: student.email, subject, ...toStudent },
    { to: student.parentEmail, subject: `${first(student.fullName)}'s ${subject.charAt(0).toLowerCase()}${subject.slice(1)}`, ...toParent },
  ]);
  if (result.sent) await logEvent(student.id, "call_link_sent", { consultationId, sent: result.sent }, actorProfileId);
  return result;
}

// ---------------------------------------------------------------- pairing

/** Tells the student who their mentor is, and the mentor about their new student. */
export async function sendPairingEmails(enrolmentId: string, actorProfileId?: string): Promise<Sent> {
  const db = adminDb();
  const [row] = await db
    .select({ student: schema.students, mentor: schema.mentors })
    .from(schema.enrolments)
    .innerJoin(schema.students, eq(schema.students.id, schema.enrolments.studentId))
    .innerJoin(schema.mentors, eq(schema.mentors.id, schema.enrolments.mentorId))
    .where(eq(schema.enrolments.id, enrolmentId));
  if (!row) return { sent: 0, errors: ["This student isn't paired"] };
  const { student, mentor } = row;

  const toStudent = renderEmail({
    eyebrow: "Your mentor",
    title: `Meet ${mentor.fullName}.`,
    paragraphs: [
      `Hi ${first(student.fullName)}, we've paired you with ${first(mentor.fullName)}, who studied ${mentor.course} at ${mentor.university} and is from ${mentor.homeTown}.`,
      `Book your first session from ${first(mentor.fullName)}'s free times, and say hello on WhatsApp or by email whenever you like.`,
    ],
    button: { label: "See your mentor", url: `${site()}/my-mentor` },
    footer: "You're getting this because you're a Njia student.",
  });
  const toMentor = renderEmail({
    eyebrow: "New student",
    title: `You have a new student: ${student.fullName}.`,
    paragraphs: [
      `Hi ${first(mentor.fullName)}, ${first(student.fullName)} wants to study ${student.courseInterest} and is aiming for ${student.dreamUniversities.join(", ")}.`,
      `They'll book their first session from your free times, so check you've added some for the next two weeks.`,
    ],
    button: { label: `See ${first(student.fullName)}'s goals`, url: `${site()}/students/${student.id}` },
    footer: "You're getting this because you're a Njia mentor.",
  });

  const result = await deliver([
    { to: student.email, subject: `Meet your mentor, ${mentor.fullName}`, ...toStudent },
    { to: mentor.email, subject: `New Njia student: ${student.fullName}`, ...toMentor },
  ]);
  if (result.sent) await logEvent(student.id, "pairing_emails_sent", { mentorId: mentor.id, sent: result.sent }, actorProfileId);
  return result;
}

// ---------------------------------------------------------------- payment nudges

export type NudgeKind = "after_call" | "follow_up";

/**
 * After the free call: invites the student and parent to pay, with their payment
 * link. Each kind goes at most once per student, and never once they've paid.
 */
export async function sendPaymentNudge(studentId: string, kind: NudgeKind, actorProfileId?: string): Promise<Sent> {
  const db = adminDb();
  const student = await db.query.students.findFirst({ where: eq(schema.students.id, studentId) });
  const enrolment = student
    ? await db.query.enrolments.findFirst({
        where: and(eq(schema.enrolments.studentId, studentId), sql`${schema.enrolments.status} <> 'cancelled'`),
        orderBy: (e, { desc }) => desc(e.createdAt),
      })
    : undefined;
  if (!student || !enrolment) return { sent: 0, errors: [] };

  const checkout = await loadCheckout(enrolment.id);
  if (!checkout?.charge) return { sent: 0, errors: [] }; // Paid already

  const [already] = await db
    .select({ id: schema.activityLog.id })
    .from(schema.activityLog)
    .where(and(eq(schema.activityLog.studentId, studentId), eq(schema.activityLog.eventType, "payment_nudge_sent"), sql`${schema.activityLog.details} ->> 'kind' = ${kind}`))
    .limit(1);
  if (already) return { sent: 0, errors: [] };

  const url = `${site()}${payPath(enrolment.id)}`;
  const amount = formatKes(checkout.balanceKes);
  const followUp = kind === "follow_up";
  const studentFirst = first(student.fullName);
  const rows: [string, string][] = [
    ["Package", `${enrolment.packageName}, ${enrolment.weeks} weeks`],
    ["To pay", amount],
    ["How", "M-Pesa or card (Visa or Mastercard)"],
  ];
  const button = { label: "Pay and get your mentor", url };

  const toStudent = renderEmail({
    eyebrow: "Next step",
    title: followUp ? "Still thinking it over?" : "Thanks for talking to us.",
    paragraphs: [
      followUp
        ? `Hi ${studentFirst}, just a reminder that your place is waiting. Once you've paid, we pair you with a Kenyan mentor who studied at one of your universities, within 2 days.`
        : `Hi ${studentFirst}, it was good to hear about your plans. When you're ready to start, pay below and we'll pair you with a mentor within 2 days.`,
    ],
    rows,
    button,
    after: ["The M-Pesa prompt can go to your parent's phone. Questions first? Message us at hello@njia.co.ke."],
    footer: "You're getting this because you had a free call with Njia.",
  });
  const toParent = renderEmail({
    eyebrow: "Next step",
    title: `Ready for ${studentFirst} to start?`,
    paragraphs: [
      `Hi ${first(student.parentName)}, ${studentFirst} had their free call with Njia. To start the 12-week mentorship, you can pay by M-Pesa or card using the link below; the M-Pesa prompt can come to your phone.`,
    ],
    rows,
    button: { label: "Pay for the mentorship", url },
    footer: `You're getting this because ${studentFirst} named you as their parent or guardian on Njia.`,
  });

  const subject = followUp ? `Reminder: ${studentFirst}'s place with Njia` : `Next step: start ${studentFirst}'s mentorship`;
  const result = await deliver([
    { to: student.email, subject, ...toStudent },
    { to: student.parentEmail, subject, ...toParent },
  ]);
  if (result.sent) await logEvent(studentId, "payment_nudge_sent", { kind, sent: result.sent }, actorProfileId);
  return result;
}

/** Daily: one follow-up for students whose free call was 3 or more days ago and who still haven't paid. */
export async function sendPaymentFollowUps(): Promise<Sent> {
  const rows = await adminDb().execute<{ student_id: string }>(sql`
    select distinct c.student_id
    from consultations c
    join consultation_slots s on s.id = c.slot_id
    where c.status = 'completed' and s.starts_at < now() - interval '3 days'
      and not exists (select 1 from activity_log a where a.student_id = c.student_id
                      and a.event_type = 'payment_nudge_sent' and a.details ->> 'kind' = 'follow_up')`);
  const total: Sent = { sent: 0, errors: [] };
  for (const r of rows) {
    const res = await sendPaymentNudge(r.student_id, "follow_up");
    total.sent += res.sent;
    for (const e of res.errors) if (!total.errors.includes(e)) total.errors.push(e);
  }
  return total;
}

// ---------------------------------------------------------------- daily list for the team

/** Paid in full, not paired, and paid more than 2 days ago. */
export async function overduePairings(): Promise<{ id: string; fullName: string; paidAt: Date }[]> {
  const rows = await adminDb().execute<{ id: string; full_name: string; paid_at: Date }>(sql`
    select s.id, s.full_name, max(coalesce(p.paid_at, p.created_at)) as paid_at
    from enrolments e
    join students s on s.id = e.student_id
    join charges c on c.enrolment_id = e.id
    join payments p on p.charge_id = c.id and p.status = 'succeeded'
    where e.mentor_id is null and e.status <> 'cancelled'
      and (select coalesce(sum(c2.amount_kes), 0) from charges c2 where c2.enrolment_id = e.id)
        <= (select coalesce(sum(p2.amount_kes), 0) from payments p2 join charges c3 on c3.id = p2.charge_id
            where c3.enrolment_id = e.id and p2.status = 'succeeded')
    group by s.id, s.full_name
    having max(coalesce(p.paid_at, p.created_at)) < now() - interval '2 days'
    order by paid_at`);
  return rows.map((r) => ({ id: r.id, fullName: r.full_name, paidAt: new Date(r.paid_at) }));
}

/** Emails every admin the students waiting too long for a mentor. Sends nothing when nobody is waiting. */
export async function sendOverdueDigest(): Promise<Sent & { overdue: number }> {
  const overdue = await overduePairings();
  if (!overdue.length) return { sent: 0, errors: [], overdue: 0 };
  const admins = await adminDb().query.profiles.findMany({ where: eq(schema.profiles.role, "admin") });

  const content = renderEmail({
    eyebrow: "Daily check",
    title: `${overdue.length} paid ${overdue.length === 1 ? "student is" : "students are"} waiting for a mentor.`,
    paragraphs: ["We promise to pair within 2 days of payment. These are past that:"],
    rows: overdue.map((s): [string, string] => [s.fullName, `paid ${formatLongDayEat(s.paidAt)}`]),
    button: { label: "Open the admin overview", url: `${site()}/admin` },
    footer: "You're getting this because you're a Njia admin. It only comes when someone is waiting.",
  });
  const result = await deliver(admins.map((a) => ({ to: a.email, subject: `Njia: ${overdue.length} waiting for a mentor`, ...content })));
  return { ...result, overdue: overdue.length };
}

// ---------------------------------------------------------------- shared work

/** Tells the mentor their student has shared work for a task. */
export async function sendTaskWorkEmail(taskId: string): Promise<Sent> {
  const [row] = await adminDb()
    .select({ task: schema.tasks, student: schema.students, mentor: schema.mentors })
    .from(schema.tasks)
    .innerJoin(schema.sessions, eq(schema.sessions.id, schema.tasks.sessionId))
    .innerJoin(schema.enrolments, eq(schema.enrolments.id, schema.sessions.enrolmentId))
    .innerJoin(schema.students, eq(schema.students.id, schema.enrolments.studentId))
    .innerJoin(schema.mentors, eq(schema.mentors.id, schema.sessions.mentorId))
    .where(eq(schema.tasks.id, taskId));
  if (!row?.task.workUrl) return { sent: 0, errors: [] };
  const { task, student, mentor } = row;

  const content = renderEmail({
    eyebrow: "Shared work",
    title: `${first(student.fullName)} shared their work.`,
    paragraphs: [`Hi ${first(mentor.fullName)}, ${first(student.fullName)} has added their work for this task:`],
    rows: [["Task", task.description]],
    button: { label: "Open the work", url: task.workUrl! },
    after: [
      "If the link asks for access, ask them to share it with your email. You can leave comments in the document and add notes on their Sessions page.",
    ],
    footer: "You're getting this because you're a Njia mentor.",
  });
  return deliver([{ to: mentor.email, subject: `${first(student.fullName)} shared work: ${task.description}`, ...content }]);
}
