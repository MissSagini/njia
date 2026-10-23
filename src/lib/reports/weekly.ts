import "server-only";
import { and, asc, desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import { adminDb, schema } from "@/db";
import { sendEmail } from "@/lib/email/send";
import { dayKeyEat, formatDayEat, formatLongDayEat, formatTimeEat } from "@/lib/time";

/**
 * The weekly parent report: sessions held, tasks done, what they worked on and
 * the next step. Parents have no login, so this email is how they follow along.
 * Reads with the server's access; callers check the caller is an admin or the cron.
 */

const { students, enrolments, mentors, sessions, tasks, programmeWeeks, activityLog } = schema;

export type WeeklyReport = {
  studentId: string;
  studentName: string;
  firstName: string;
  parentName: string;
  parentEmail: string;
  mentorName: string;
  week: string;
  held: { startsAt: string; title: string | null }[];
  missed: { startsAt: string }[];
  tasks: { description: string; done: boolean }[];
  next: { startsAt: string; title: string | null } | null;
  heldTotal: number;
  weeks: number;
};

/** "2026-W43", the ISO week in East Africa Time, so each parent gets one report a week. */
export function reportWeek(now = new Date()): string {
  const [y, m, d] = dayKeyEat(now).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** This week's report for one paired student, or null if they have no active, paired enrolment. */
export async function buildWeeklyReport(studentId: string, now = new Date()): Promise<WeeklyReport | null> {
  const db = adminDb();
  const [row] = await db
    .select({ student: students, enrolment: enrolments, mentorName: mentors.fullName })
    .from(enrolments)
    .innerJoin(students, eq(students.id, enrolments.studentId))
    .innerJoin(mentors, eq(mentors.id, enrolments.mentorId))
    .where(and(eq(enrolments.studentId, studentId), eq(enrolments.status, "active")))
    .orderBy(desc(enrolments.createdAt))
    .limit(1);
  if (!row) return null;

  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const all = await db
    .select({ id: sessions.id, startsAt: sessions.startsAt, status: sessions.status, title: programmeWeeks.title })
    .from(sessions)
    .leftJoin(programmeWeeks, eq(programmeWeeks.weekNumber, sessions.weekNumber))
    .where(and(eq(sessions.enrolmentId, row.enrolment.id), ne(sessions.status, "cancelled")))
    .orderBy(asc(sessions.startsAt));

  const past = all.filter((s) => s.startsAt < now);
  const thisWeek = past.filter((s) => s.startsAt >= weekAgo);
  const latest = past.at(-1);
  const upcoming = all.find((s) => s.startsAt >= now);

  // The checklist from the latest session is this week's tasks
  const taskRows = latest
    ? await db
        .select({ description: tasks.description, done: tasks.done })
        .from(tasks)
        .where(eq(tasks.sessionId, latest.id))
        .orderBy(asc(tasks.position), asc(tasks.createdAt))
    : [];

  return {
    studentId,
    studentName: row.student.fullName,
    firstName: row.student.fullName.split(" ")[0],
    parentName: row.student.parentName,
    parentEmail: row.student.parentEmail,
    mentorName: row.mentorName,
    week: reportWeek(now),
    held: thisWeek.filter((s) => s.status !== "missed").map((s) => ({ startsAt: s.startsAt.toISOString(), title: s.title })),
    missed: thisWeek.filter((s) => s.status === "missed").map((s) => ({ startsAt: s.startsAt.toISOString() })),
    tasks: taskRows,
    next: upcoming ? { startsAt: upcoming.startsAt.toISOString(), title: upcoming.title } : null,
    heldTotal: past.filter((s) => s.status !== "missed").length,
    weeks: row.enrolment.weeks,
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The report as an email: subject, HTML (inline styles for email clients) and plain text. */
export function renderWeeklyReport(r: WeeklyReport) {
  const parentFirst = r.parentName.split(" ")[0];
  const done = r.tasks.filter((t) => t.done).length;
  const rows: [string, string][] = [
    [
      "Sessions held",
      r.held.length ? `${r.held.length} (${r.held.map((s) => formatDayEat(s.startsAt)).join(", ")})` : "None this week",
    ],
    ["Tasks completed", r.tasks.length ? `${done} of ${r.tasks.length}` : "No tasks set yet"],
    ["Worked on", r.held.map((s) => s.title).filter(Boolean).join("; ") || "Nothing new this week"],
    [
      "Next step",
      r.next
        ? `${r.next.title ?? "Next session"}, ${formatLongDayEat(r.next.startsAt)} at ${formatTimeEat(r.next.startsAt)} EAT`
        : `${r.firstName} hasn't booked the next session yet`,
    ],
  ];
  if (r.missed.length) rows.splice(1, 0, ["Missed", `${r.missed.length} session${r.missed.length === 1 ? "" : "s"} (${r.missed.map((s) => formatDayEat(s.startsAt)).join(", ")})`]);

  const subject = `${r.firstName}'s week with Njia`;
  const intro = `Hi ${parentFirst}, here's how ${r.firstName} got on this week with ${r.mentorName.split(" ")[0]}, their mentor.`;
  const progress = `${r.heldTotal} of ${r.weeks} sessions held so far.`;
  const footer = `You're getting this because ${r.firstName} named you as their parent or guardian on Njia. You don't need an account.`;

  const text = [
    intro,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    ...(r.tasks.length ? ["", "This week's tasks:", ...r.tasks.map((t) => `${t.done ? "[done]" : "[ ]"} ${t.description}`)] : []),
    "",
    progress,
    "",
    "The Njia team",
    "",
    footer,
  ].join("\n");

  const cell = "padding:10px 0;border-top:1px solid #E6DCCB;font:16px/24px Arial,sans-serif;color:#1C2A23;vertical-align:top";
  const html = `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#FBF6EE">
<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E6DCCB;border-radius:12px" cellpadding="0" cellspacing="0"><tr><td style="padding:28px 24px">
<p style="margin:0 0 6px;font:bold 12px/16px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#1F4D3A">Weekly report · ${esc(r.studentName)}</p>
<h1 style="margin:0 0 12px;font:600 26px/32px Georgia,serif;color:#1C2A23">${esc(subject)}.</h1>
<p style="margin:0 0 20px;font:16px/26px Arial,sans-serif;color:#5A6660">${esc(intro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${rows.map(([k, v]) => `<tr><td style="${cell};width:42%;font-weight:bold">${esc(k)}</td><td style="${cell}">${esc(v)}</td></tr>`).join("\n")}
</table>
${
  r.tasks.length
    ? `<p style="margin:20px 0 8px;font:bold 15px/22px Arial,sans-serif;color:#1C2A23">This week's tasks</p>
<ul style="margin:0;padding-left:20px;font:16px/26px Arial,sans-serif;color:#1C2A23">${r.tasks
        .map((t) => `<li style="${t.done ? "color:#5A6660;text-decoration:line-through" : ""}">${esc(t.description)}</li>`)
        .join("")}</ul>`
    : ""
}
<p style="margin:20px 0 0;font:16px/26px Arial,sans-serif;color:#1C2A23">${esc(progress)}</p>
<p style="margin:20px 0 0;font:16px/26px Arial,sans-serif;color:#1C2A23">The Njia team</p>
</td></tr></table>
<p style="max-width:560px;margin:16px auto 0;font:13px/20px Arial,sans-serif;color:#5A6660;text-align:center">${esc(footer)}</p>
</body></html>`;

  return { subject, html, text };
}

/** Whether this student's parent already got this week's report. */
async function alreadySent(studentId: string, week: string) {
  const [row] = await adminDb()
    .select({ id: activityLog.id })
    .from(activityLog)
    .where(and(eq(activityLog.studentId, studentId), eq(activityLog.eventType, "parent_report_sent"), sql`${activityLog.details} ->> 'week' = ${week}`))
    .limit(1);
  return !!row;
}

/** Sends this week's report to every paired student's parent who hasn't had it. Safe to run more than once. */
export async function sendWeeklyReports(now = new Date()) {
  const db = adminDb();
  const due = await db
    .selectDistinct({ studentId: enrolments.studentId })
    .from(enrolments)
    .where(and(eq(enrolments.status, "active"), isNotNull(enrolments.mentorId)));

  const week = reportWeek(now);
  const result = { sent: 0, skipped: 0, failed: 0, errors: [] as string[] };
  for (const { studentId } of due) {
    if (await alreadySent(studentId, week)) {
      result.skipped++;
      continue;
    }
    const report = await buildWeeklyReport(studentId, now);
    if (!report) {
      result.skipped++;
      continue;
    }
    try {
      const email = renderWeeklyReport(report);
      await sendEmail({ to: report.parentEmail, ...email });
      await db.insert(activityLog).values({ studentId, eventType: "parent_report_sent", details: { week } });
      result.sent++;
    } catch (error) {
      result.failed++;
      // The reason only: no names or addresses in logs
      const reason = (error as Error).message;
      if (!result.errors.includes(reason)) result.errors.push(reason);
      console.error("reports: send failed", reason);
    }
  }
  return result;
}

/** When the reports last went out, for the admin overview. */
export async function lastReportRun(): Promise<{ week: string; at: string; count: number } | null> {
  const db = adminDb();
  const [latest] = await db
    .select({ week: sql<string>`${activityLog.details} ->> 'week'`, at: activityLog.createdAt })
    .from(activityLog)
    .where(eq(activityLog.eventType, "parent_report_sent"))
    .orderBy(desc(activityLog.createdAt))
    .limit(1);
  if (!latest) return null;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activityLog)
    .where(and(eq(activityLog.eventType, "parent_report_sent"), sql`${activityLog.details} ->> 'week' = ${latest.week}`));
  return { week: latest.week, at: latest.at.toISOString(), count };
}

