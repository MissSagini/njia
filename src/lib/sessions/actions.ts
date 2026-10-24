"use server";

import { and, count, eq, gt, ne, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { adminDb, asUser, schema } from "@/db";
import { logAccess, requireViewer, type Viewer } from "@/lib/auth/dal";
import { calendarConnected, createMeetEvent } from "@/lib/google/calendar";
import { sendTaskWorkEmail } from "@/lib/email/notifications";
import { meetLinkSchema, workLinkSchema } from "@/lib/links";
import { isTimeZone, zonedToUtc } from "@/lib/time";
import { MIN_NOTICE_HOURS } from "./data";

const SOMETHING_WRONG = "That didn't save. Please try again.";
const SESSION_MINUTES = 60;
const MAX_TASKS = 10;

function isUniqueViolation(error: unknown, constraint: string): boolean {
  for (let e = error as { code?: string; constraint_name?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.code === "23505" && e.constraint_name === constraint) return true;
  }
  return false;
}

function isForeignKeyViolation(error: unknown): boolean {
  for (let e = error as { code?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.code === "23503") return true;
  }
  return false;
}

// ---------------------------------------------------------------- student: booking and tasks

export type BookState = { error?: string; takenId?: string; bookedAt?: string };

/** Books the student's next session in one of their mentor's free times. */
export async function bookSession(_prev: BookState, formData: FormData): Promise<BookState> {
  const viewer = await requireViewer(["student"]);
  const availabilityId = String(formData.get("availabilityId") ?? "");
  if (!z.uuid().safeParse(availabilityId).success) return { error: "Choose a time first." };

  // Who the student is and their mentor, read as the student so RLS applies
  const mine = await asUser(viewer.claims, async (tx) => {
    const student = await tx.query.students.findFirst({ where: eq(schema.students.profileId, viewer.profileId) });
    if (!student) return null;
    const enrolment = await tx.query.enrolments.findFirst({
      where: and(eq(schema.enrolments.studentId, student.id), ne(schema.enrolments.status, "cancelled")),
      orderBy: (e, { desc }) => desc(e.createdAt),
    });
    return enrolment?.mentorId ? { student, enrolment, mentorId: enrolment.mentorId } : null;
  });
  if (!mine) return { error: "You can book once you've been paired with a mentor." };

  try {
    const booked = await adminDb().transaction(async (tx) => {
      // One booking at a time per student: lock their enrolment
      await tx.execute(sql`select id from enrolments where id = ${mine.enrolment.id} for update`);

      const { sessions, mentorAvailability } = schema;
      const [{ total }] = await tx
        .select({ total: count() })
        .from(sessions)
        .where(and(eq(sessions.enrolmentId, mine.enrolment.id), ne(sessions.status, "cancelled")));
      const [{ upcoming }] = await tx
        .select({ upcoming: count() })
        .from(sessions)
        .where(and(eq(sessions.enrolmentId, mine.enrolment.id), eq(sessions.status, "scheduled"), gt(sessions.startsAt, new Date())));
      if (upcoming > 0) return { error: "You already have a session booked. You can book the next one after it." } as const;
      if (total >= mine.enrolment.weeks) return { error: `You've booked all ${mine.enrolment.weeks} of your sessions.` } as const;

      const slot = await tx.query.mentorAvailability.findFirst({
        where: and(
          eq(mentorAvailability.id, availabilityId),
          eq(mentorAvailability.mentorId, mine.mentorId),
          gt(mentorAvailability.startsAt, new Date(Date.now() + MIN_NOTICE_HOURS * 3_600_000)),
        ),
      });
      if (!slot) return { taken: true } as const;

      const [session] = await tx
        .insert(sessions)
        .values({
          enrolmentId: mine.enrolment.id,
          mentorId: mine.mentorId,
          weekNumber: Math.min(total + 1, 12),
          availabilityId: slot.id,
          startsAt: slot.startsAt,
        })
        .returning({ id: sessions.id });

      await tx.insert(schema.activityLog).values({
        studentId: mine.student.id,
        actorProfileId: viewer.profileId,
        eventType: "session_booked",
        details: { sessionId: session.id, startsAt: slot.startsAt.toISOString() },
      });
      return { sessionId: session.id, startsAt: slot.startsAt, endsAt: slot.endsAt } as const;
    });

    if ("error" in booked) return { error: booked.error };
    if ("taken" in booked) return { takenId: availabilityId, error: "Someone just booked that time. Choose another one." };

    if (calendarConnected()) {
      const mentor = await adminDb().query.mentors.findFirst({ where: eq(schema.mentors.id, mine.mentorId) });
      after(() =>
        inviteToSession(booked, mine.student.fullName, [mine.student.email, ...(mentor ? [mentor.email] : [])]),
      );
    }
    refresh();
    return { bookedAt: booked.startsAt.toISOString() };
  } catch (error) {
    if (isUniqueViolation(error, "sessions_availability_id_unique")) {
      return { takenId: availabilityId, error: "Someone just booked that time. Choose another one." };
    }
    console.error("sessions: booking failed", (error as { code?: string }).code);
    return { error: SOMETHING_WRONG };
  }
}

async function inviteToSession(session: { sessionId: string; startsAt: Date; endsAt: Date }, studentName: string, attendees: string[]) {
  try {
    const { eventId, meetLink } = await createMeetEvent({
      requestId: session.sessionId,
      summary: `Njia session with ${studentName}`,
      description: "Your weekly Njia mentoring session. Your mentor's notes and this week's tasks will be on the Sessions page.",
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      attendees,
    });
    await adminDb().update(schema.sessions).set({ meetLink, calendarEventId: eventId }).where(eq(schema.sessions.id, session.sessionId));
  } catch (error) {
    console.error("sessions: calendar invite failed", (error as Error).message);
  }
}

/** The student ticks a task on or off. */
export async function setTaskDone(taskId: string, done: boolean): Promise<{ error?: string }> {
  const viewer = await requireViewer(["student"]);
  if (!z.uuid().safeParse(taskId).success) return { error: SOMETHING_WRONG };

  // Only tasks on the student's own sessions are visible to them
  const task = await asUser(viewer.claims, async (tx) => {
    const studentId = (await tx.query.students.findFirst({ where: eq(schema.students.profileId, viewer.profileId) }))?.id;
    const row = await tx.query.tasks.findFirst({ where: eq(schema.tasks.id, taskId) });
    return row && studentId ? { ...row, studentId } : null;
  });
  if (!task) return { error: SOMETHING_WRONG };
  if (task.done === done) return {};

  await adminDb().transaction(async (tx) => {
    await tx.update(schema.tasks).set({ done, doneAt: done ? new Date() : null }).where(eq(schema.tasks.id, taskId));
    await tx.insert(schema.activityLog).values({
      studentId: task.studentId,
      actorProfileId: viewer.profileId,
      eventType: done ? "task_done" : "task_undone",
      details: { taskId },
    });
  });
  refresh();
  return {};
}

/** The mentor cancels an upcoming session and frees its time. Students can't cancel or move sessions. */
export async function cancelSession(sessionId: string): Promise<{ error?: string }> {
  const viewer = await requireViewer(["mentor"]);
  const row = await mentorSessionRow(viewer, sessionId);
  if (!row) return { error: SOMETHING_WRONG };
  const { session } = row;
  if (session.status !== "scheduled" || session.startsAt <= new Date()) return { error: "Only upcoming sessions can be cancelled." };

  await adminDb().transaction(async (tx) => {
    // Letting go of the free time puts it back on offer
    await tx.update(schema.sessions).set({ status: "cancelled", availabilityId: null }).where(eq(schema.sessions.id, session.id));
    await tx.insert(schema.activityLog).values({
      studentId: row.studentId,
      actorProfileId: viewer.profileId,
      eventType: "session_cancelled",
      details: { sessionId: session.id, startsAt: session.startsAt.toISOString() },
    });
  });
  await logAccess(viewer, row.studentId, "update", "sessions");
  refresh();
  return {};
}

/** The mentor records whether a past session happened. */
export async function setSessionOutcome(sessionId: string, outcome: "held" | "missed"): Promise<{ error?: string }> {
  const viewer = await requireViewer(["mentor"]);
  if (outcome !== "held" && outcome !== "missed") return { error: SOMETHING_WRONG };
  const row = await mentorSessionRow(viewer, sessionId);
  if (!row || row.session.status === "cancelled") return { error: SOMETHING_WRONG };
  if (row.session.startsAt > new Date()) return { error: "You can mark a session once it has started." };
  if (row.session.status === outcome) return {};

  await adminDb().transaction(async (tx) => {
    await tx.update(schema.sessions).set({ status: outcome }).where(eq(schema.sessions.id, row.session.id));
    await tx.insert(schema.activityLog).values({
      studentId: row.studentId,
      actorProfileId: viewer.profileId,
      eventType: `session_${outcome}`,
      details: { sessionId: row.session.id },
    });
  });
  await logAccess(viewer, row.studentId, "update", "sessions");
  refresh();
  return {};
}

/** A session the signed-in mentor runs, as a full row with its student, or null. */
async function mentorSessionRow(viewer: Viewer, sessionId: string) {
  if (!z.uuid().safeParse(sessionId).success) return null;
  return asUser(viewer.claims, async (tx) => {
    const mentor = await tx.query.mentors.findFirst({ where: eq(schema.mentors.profileId, viewer.profileId) });
    if (!mentor) return null;
    const [row] = await tx
      .select({ session: schema.sessions, studentId: schema.enrolments.studentId })
      .from(schema.sessions)
      .innerJoin(schema.enrolments, eq(schema.enrolments.id, schema.sessions.enrolmentId))
      .where(and(eq(schema.sessions.id, sessionId), eq(schema.sessions.mentorId, mentor.id)));
    return row ?? null;
  });
}

export type WorkState = { error?: string; saved?: number; removed?: boolean };

/** The student adds, changes or removes the link to their work for a task. */
export async function shareTaskWork(_prev: WorkState, formData: FormData): Promise<WorkState> {
  const viewer = await requireViewer(["student"]);
  const taskId = String(formData.get("taskId") ?? "");
  if (!z.uuid().safeParse(taskId).success) return { error: SOMETHING_WRONG };
  const link = workLinkSchema.safeParse(String(formData.get("workUrl") ?? ""));
  if (!link.success) return { error: link.error.issues[0].message };

  // Only tasks on the student's own sessions are visible to them
  const task = await asUser(viewer.claims, async (tx) => {
    const studentId = (await tx.query.students.findFirst({ where: eq(schema.students.profileId, viewer.profileId) }))?.id;
    const row = await tx.query.tasks.findFirst({ where: eq(schema.tasks.id, taskId) });
    return row && studentId ? { ...row, studentId } : null;
  });
  if (!task) return { error: SOMETHING_WRONG };
  if (task.workUrl === link.data) return { saved: Date.now() };

  await adminDb().transaction(async (tx) => {
    await tx
      .update(schema.tasks)
      .set({ workUrl: link.data, workSharedAt: link.data ? new Date() : null })
      .where(eq(schema.tasks.id, taskId));
    await tx.insert(schema.activityLog).values({
      studentId: task.studentId,
      actorProfileId: viewer.profileId,
      eventType: link.data ? "task_work_shared" : "task_work_removed",
      details: { taskId },
    });
  });
  // The mentor hears about new work; a failed email doesn't undo the save
  if (link.data) await sendTaskWorkEmail(taskId);
  refresh();
  return link.data ? { saved: Date.now() } : { removed: true, saved: Date.now() };
}

// ---------------------------------------------------------------- mentor: notes and tasks

/** A session the signed-in mentor runs, with its student, or null. */
async function mentorSession(viewer: Viewer, sessionId: string) {
  if (!z.uuid().safeParse(sessionId).success) return null;
  return asUser(viewer.claims, async (tx) => {
    const mentor = await tx.query.mentors.findFirst({ where: eq(schema.mentors.profileId, viewer.profileId) });
    if (!mentor) return null;
    const [row] = await tx
      .select({ id: schema.sessions.id, studentId: schema.enrolments.studentId })
      .from(schema.sessions)
      .innerJoin(schema.enrolments, eq(schema.enrolments.id, schema.sessions.enrolmentId))
      .where(and(eq(schema.sessions.id, sessionId), eq(schema.sessions.mentorId, mentor.id)));
    return row ?? null;
  });
}

export type NotesState = {
  error?: string;
  fieldErrors?: { meetLink?: string; notes?: string };
  /** What was typed, so a rejected save doesn't wipe it. */
  values?: { notes: string; meetLink: string };
  saved?: number;
};

/** The mentor saves their notes and the call link for a session. */
export async function saveSessionNotes(_prev: NotesState, formData: FormData): Promise<NotesState> {
  const viewer = await requireViewer(["mentor"]);
  const values = { notes: String(formData.get("notes") ?? ""), meetLink: String(formData.get("meetLink") ?? "") };
  const session = await mentorSession(viewer, String(formData.get("sessionId") ?? ""));
  if (!session) return { values, error: SOMETHING_WRONG };

  const link = meetLinkSchema.safeParse(String(formData.get("meetLink") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim();
  if (!link.success) return { values, fieldErrors: { meetLink: link.error.issues[0].message } };
  if (notes.length > 10_000) return { values, fieldErrors: { notes: "That's a bit long. Shorten it, please." } };

  await adminDb().transaction(async (tx) => {
    await tx.update(schema.sessions).set({ mentorNotes: notes || null, meetLink: link.data }).where(eq(schema.sessions.id, session.id));
    await tx.insert(schema.activityLog).values({
      studentId: session.studentId,
      actorProfileId: viewer.profileId,
      eventType: "session_notes_saved",
      details: { sessionId: session.id },
    });
  });
  await logAccess(viewer, session.studentId, "update", "session_notes");
  refresh();
  return { saved: Date.now() };
}

export type TaskState = { error?: string; added?: number };

/** The mentor adds a task to a session's checklist. */
export async function addTask(_prev: TaskState, formData: FormData): Promise<TaskState> {
  const viewer = await requireViewer(["mentor"]);
  const session = await mentorSession(viewer, String(formData.get("sessionId") ?? ""));
  if (!session) return { error: SOMETHING_WRONG };

  const description = String(formData.get("description") ?? "").trim().replace(/\s+/g, " ");
  if (!description) return { error: "Write the task first." };
  if (description.length > 280) return { error: "Keep a task to one short sentence." };

  const added = await adminDb().transaction(async (tx) => {
    const [{ n }] = await tx.select({ n: count() }).from(schema.tasks).where(eq(schema.tasks.sessionId, session.id));
    if (n >= MAX_TASKS) return false;
    const [task] = await tx
      .insert(schema.tasks)
      .values({ sessionId: session.id, description, position: n })
      .returning({ id: schema.tasks.id });
    await tx.insert(schema.activityLog).values({
      studentId: session.studentId,
      actorProfileId: viewer.profileId,
      eventType: "task_added",
      details: { sessionId: session.id, taskId: task.id },
    });
    return true;
  });
  if (!added) return { error: `A session can have up to ${MAX_TASKS} tasks. Keep the list short.` };

  await logAccess(viewer, session.studentId, "update", "tasks");
  refresh();
  return { added: Date.now() };
}

/** The mentor removes a task. */
export async function removeTask(taskId: string): Promise<{ error?: string }> {
  const viewer = await requireViewer(["mentor"]);
  if (!z.uuid().safeParse(taskId).success) return { error: SOMETHING_WRONG };
  const task = await asUser(viewer.claims, (tx) => tx.query.tasks.findFirst({ where: eq(schema.tasks.id, taskId) }));
  const session = task ? await mentorSession(viewer, task.sessionId) : null;
  if (!task || !session) return { error: SOMETHING_WRONG };

  await adminDb().transaction(async (tx) => {
    await tx.delete(schema.tasks).where(eq(schema.tasks.id, taskId));
    await tx.insert(schema.activityLog).values({
      studentId: session.studentId,
      actorProfileId: viewer.profileId,
      eventType: "task_removed",
      details: { sessionId: session.id, description: task.description },
    });
  });
  await logAccess(viewer, session.studentId, "update", "tasks");
  refresh();
  return {};
}

// ---------------------------------------------------------------- mentor: free times

export type FreeTimeState = { error?: string; fieldErrors?: { date?: string; time?: string }; added?: number; skipped?: number };

async function myMentor(viewer: Viewer) {
  return asUser(viewer.claims, (tx) => tx.query.mentors.findFirst({ where: eq(schema.mentors.profileId, viewer.profileId) }));
}

/** The mentor adds a free time (in their own zone), optionally repeating weekly. */
export async function addFreeTimes(_prev: FreeTimeState, formData: FormData): Promise<FreeTimeState> {
  const viewer = await requireViewer(["mentor"]);
  const mentor = await myMentor(viewer);
  if (!mentor) return { error: SOMETHING_WRONG };

  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const weeks = Math.min(Math.max(Number(formData.get("repeatWeeks") ?? 1) || 1, 1), 12);
  const fieldErrors: FreeTimeState["fieldErrors"] = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fieldErrors.date = "Choose a day.";
  if (!/^\d{2}:\d{2}$/.test(time)) fieldErrors.time = "Choose a start time.";
  if (fieldErrors.date || fieldErrors.time) return { fieldErrors };

  const tz = isTimeZone(mentor.timeZone) ? mentor.timeZone : "Europe/London";
  const rows = Array.from({ length: weeks }, (_, i) => {
    const day = new Date(`${date}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() + i * 7);
    const startsAt = zonedToUtc(day.toISOString().slice(0, 10), time, tz);
    return { mentorId: mentor.id, startsAt, endsAt: new Date(startsAt.getTime() + SESSION_MINUTES * 60_000) };
  }).filter((r) => r.startsAt.getTime() > Date.now() + MIN_NOTICE_HOURS * 3_600_000);

  if (rows.length === 0) return { fieldErrors: { date: `Choose a time at least ${MIN_NOTICE_HOURS} hours from now.` } };

  const inserted = await adminDb()
    .insert(schema.mentorAvailability)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: schema.mentorAvailability.id });
  refresh();
  return { added: inserted.length, skipped: rows.length - inserted.length };
}

/** The mentor removes a free time nobody has booked. */
export async function removeFreeTime(id: string): Promise<{ error?: string }> {
  const viewer = await requireViewer(["mentor"]);
  const mentor = await myMentor(viewer);
  if (!mentor || !z.uuid().safeParse(id).success) return { error: SOMETHING_WRONG };
  try {
    await adminDb()
      .delete(schema.mentorAvailability)
      .where(and(eq(schema.mentorAvailability.id, id), eq(schema.mentorAvailability.mentorId, mentor.id)));
  } catch (error) {
    // A booked time is held by its session
    if (isForeignKeyViolation(error)) return { error: "A student has booked this time, so it can't be removed." };
    throw error;
  }
  refresh();
  return {};
}
