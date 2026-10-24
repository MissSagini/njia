import "server-only";
import { and, asc, desc, eq, gt, inArray, ne, notExists } from "drizzle-orm";
import { adminDb, asUser, schema, type Tx } from "@/db";
import type { Viewer } from "@/lib/auth/dal";
import { logAccess } from "@/lib/auth/dal";

/** Least notice a mentor needs before a session, and how far ahead students can book. */
export const MIN_NOTICE_HOURS = 12;
export const BOOKING_WINDOW_DAYS = 28;

export type SessionTask = { id: string; description: string; done: boolean; workUrl: string | null };
export type SessionItem = {
  id: string;
  startsAt: string;
  endsAt: string;
  weekNumber: number | null;
  weekTitle: string | null;
  status: "scheduled" | "held" | "missed" | "cancelled";
  meetLink: string | null;
  mentorNotes: string | null;
  tasks: SessionTask[];
};
export type FreeTime = { id: string; startsAt: string; endsAt: string };

export type BookingBlock = "no_mentor" | "upcoming" | "complete";

export type SessionsData = {
  student: { id: string; fullName: string };
  mentor: { id: string; fullName: string; timeZone: string; email: string } | null;
  enrolment: { id: string; weeks: number } | null;
  sessions: SessionItem[];
  /** The mentor's open times, only when the student can book. */
  freeTimes: FreeTime[];
  bookingBlock: BookingBlock | null;
  /** When this was loaded, so server and browser agree on what's upcoming. */
  now: string;
};

const SESSION_MINUTES = 60;

/** The student's current enrolment: the newest one that isn't cancelled. */
async function currentEnrolment(tx: Tx, studentId: string) {
  return tx.query.enrolments.findFirst({
    where: and(eq(schema.enrolments.studentId, studentId), ne(schema.enrolments.status, "cancelled")),
    orderBy: desc(schema.enrolments.createdAt),
  });
}

async function loadSessions(tx: Tx, enrolmentId: string): Promise<SessionItem[]> {
  const { sessions, tasks, programmeWeeks, mentorAvailability } = schema;
  const rows = await tx
    .select({
      id: sessions.id,
      startsAt: sessions.startsAt,
      endsAt: mentorAvailability.endsAt,
      weekNumber: sessions.weekNumber,
      weekTitle: programmeWeeks.title,
      status: sessions.status,
      meetLink: sessions.meetLink,
      mentorNotes: sessions.mentorNotes,
    })
    .from(sessions)
    .leftJoin(programmeWeeks, eq(programmeWeeks.weekNumber, sessions.weekNumber))
    .leftJoin(mentorAvailability, eq(mentorAvailability.id, sessions.availabilityId))
    .where(and(eq(sessions.enrolmentId, enrolmentId), ne(sessions.status, "cancelled")))
    .orderBy(asc(sessions.startsAt));

  const taskRows = rows.length
    ? await tx
        .select({ id: tasks.id, sessionId: tasks.sessionId, description: tasks.description, done: tasks.done, workUrl: tasks.workUrl })
        .from(tasks)
        .where(inArray(tasks.sessionId, rows.map((r) => r.id)))
        .orderBy(asc(tasks.position), asc(tasks.createdAt))
    : [];

  return rows.map((r) => ({
    ...r,
    startsAt: r.startsAt.toISOString(),
    endsAt: (r.endsAt ?? new Date(r.startsAt.getTime() + SESSION_MINUTES * 60_000)).toISOString(),
    tasks: taskRows.filter((t) => t.sessionId === r.id).map(({ id, description, done, workUrl }) => ({ id, description, done, workUrl })),
  }));
}

/** Why a student can't book right now, or null if they can. */
export function bookingBlockFor(enrolment: { mentorId: string | null; weeks: number } | undefined, sessions: { startsAt: string }[]): BookingBlock | null {
  if (!enrolment?.mentorId) return "no_mentor";
  if (sessions.some((s) => new Date(s.startsAt).getTime() > Date.now())) return "upcoming";
  if (sessions.length >= enrolment.weeks) return "complete";
  return null;
}

/**
 * A mentor's free times that nobody has booked. Read with the server's access,
 * because RLS hides other students' sessions; callers must have checked the
 * viewer is this mentor or one of their students.
 */
export async function openFreeTimes(mentorId: string): Promise<FreeTime[]> {
  const { mentorAvailability: a, sessions } = schema;
  const rows = await adminDb()
    .select({ id: a.id, startsAt: a.startsAt, endsAt: a.endsAt })
    .from(a)
    .where(
      and(
        eq(a.mentorId, mentorId),
        gt(a.startsAt, new Date(Date.now() + MIN_NOTICE_HOURS * 3_600_000)),
        notExists(adminDb().select({ id: sessions.id }).from(sessions).where(eq(sessions.availabilityId, a.id))),
      ),
    )
    .orderBy(asc(a.startsAt));
  return rows.map((r) => ({ id: r.id, startsAt: r.startsAt.toISOString(), endsAt: r.endsAt.toISOString() }));
}

async function sessionsFor(viewer: Viewer, where: { profileId: string } | { studentId: string }): Promise<SessionsData | null> {
  const loaded = await asUser(viewer.claims, async (tx) => {
    const student = await tx.query.students.findFirst({
      where: "profileId" in where ? eq(schema.students.profileId, where.profileId) : eq(schema.students.id, where.studentId),
      columns: { id: true, fullName: true },
    });
    if (!student) return null;

    const enrolment = await currentEnrolment(tx, student.id);
    const mentor = enrolment?.mentorId
      ? await tx.query.mentors.findFirst({
          where: eq(schema.mentors.id, enrolment.mentorId),
          columns: { id: true, fullName: true, timeZone: true, email: true },
        })
      : undefined;
    const sessions = enrolment ? await loadSessions(tx, enrolment.id) : [];
    return { student, enrolment, mentor, sessions };
  });
  if (!loaded) return null;

  const { student, enrolment, mentor, sessions } = loaded;
  const bookingBlock = bookingBlockFor(mentor ? enrolment : undefined, sessions);
  return {
    student,
    mentor: mentor ?? null,
    enrolment: enrolment ? { id: enrolment.id, weeks: enrolment.weeks } : null,
    sessions,
    freeTimes: mentor && !bookingBlock ? await openFreeTimes(mentor.id) : [],
    bookingBlock,
    now: new Date().toISOString(),
  };
}

/** The signed-in student's sessions. */
export function studentSessions(viewer: Viewer) {
  return sessionsFor(viewer, { profileId: viewer.profileId });
}

/** One of the signed-in mentor's students, or null if they aren't paired with them. Logged. */
export async function menteeSessions(viewer: Viewer, studentId: string) {
  const data = await sessionsFor(viewer, { studentId });
  if (data) await logAccess(viewer, studentId, "view", "sessions");
  return data;
}

export type Mentee = { studentId: string; fullName: string; nextSessionAt: string | null };

/** The signed-in mentor's paired students, for switching between them. */
export async function mentees(viewer: Viewer): Promise<{ mentorId: string; timeZone: string; students: Mentee[] } | null> {
  return asUser(viewer.claims, async (tx) => {
    const mentor = await tx.query.mentors.findFirst({
      where: eq(schema.mentors.profileId, viewer.profileId),
      columns: { id: true, timeZone: true },
    });
    if (!mentor) return null;

    const { enrolments, students, sessions } = schema;
    const rows = await tx
      .select({ studentId: students.id, fullName: students.fullName, enrolmentId: enrolments.id })
      .from(enrolments)
      .innerJoin(students, eq(students.id, enrolments.studentId))
      .where(and(eq(enrolments.mentorId, mentor.id), inArray(enrolments.status, ["active", "pending_payment"])))
      .orderBy(asc(students.fullName));

    const upcoming = rows.length
      ? await tx
          .select({ enrolmentId: sessions.enrolmentId, startsAt: sessions.startsAt })
          .from(sessions)
          .where(and(inArray(sessions.enrolmentId, rows.map((r) => r.enrolmentId)), eq(sessions.status, "scheduled"), gt(sessions.startsAt, new Date())))
          .orderBy(asc(sessions.startsAt))
      : [];

    return {
      mentorId: mentor.id,
      timeZone: mentor.timeZone,
      students: rows.map((r) => ({
        studentId: r.studentId,
        fullName: r.fullName,
        nextSessionAt: upcoming.find((u) => u.enrolmentId === r.enrolmentId)?.startsAt.toISOString() ?? null,
      })),
    };
  });
}

/** The signed-in mentor's own upcoming free times, booked or not. */
export async function myFreeTimes(viewer: Viewer) {
  return asUser(viewer.claims, async (tx) => {
    const mentor = await tx.query.mentors.findFirst({
      where: eq(schema.mentors.profileId, viewer.profileId),
      columns: { id: true, timeZone: true },
    });
    if (!mentor) return null;
    const { mentorAvailability: a, sessions, enrolments, students } = schema;
    const rows = await tx
      .select({ id: a.id, startsAt: a.startsAt, endsAt: a.endsAt, bookedBy: students.fullName })
      .from(a)
      .leftJoin(sessions, eq(sessions.availabilityId, a.id))
      .leftJoin(enrolments, eq(enrolments.id, sessions.enrolmentId))
      .leftJoin(students, eq(students.id, enrolments.studentId))
      .where(and(eq(a.mentorId, mentor.id), gt(a.endsAt, new Date())))
      .orderBy(asc(a.startsAt));
    return {
      timeZone: mentor.timeZone,
      times: rows.map((r) => ({
        id: r.id,
        startsAt: r.startsAt.toISOString(),
        endsAt: r.endsAt.toISOString(),
        bookedBy: r.bookedBy,
      })),
    };
  });
}
