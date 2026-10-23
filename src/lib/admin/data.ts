import "server-only";
import { and, asc, desc, eq, gt, gte, inArray, lt, ne, sql, sum } from "drizzle-orm";
import { asUser, schema, type Tx } from "@/db";
import { logAccess, type Viewer } from "@/lib/auth/dal";

/**
 * Admin reads. They run as the signed-in admin, so RLS (private.is_admin())
 * applies; opening one student's record is written to the access log.
 */

const { students, enrolments, mentors, charges, payments, consultations, consultationSlots: slots, sessions } = schema;

/** Charges minus succeeded payments for each enrolment. Never stored. */
async function balances(tx: Tx, enrolmentIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (!enrolmentIds.length) return result;
  const owed = await tx
    .select({ id: charges.enrolmentId, total: sum(charges.amountKes) })
    .from(charges)
    .where(inArray(charges.enrolmentId, enrolmentIds))
    .groupBy(charges.enrolmentId);
  const paid = await tx
    .select({ id: charges.enrolmentId, total: sum(payments.amountKes) })
    .from(payments)
    .innerJoin(charges, eq(charges.id, payments.chargeId))
    .where(and(inArray(charges.enrolmentId, enrolmentIds), eq(payments.status, "succeeded")))
    .groupBy(charges.enrolmentId);
  for (const id of enrolmentIds) {
    const o = Number(owed.find((r) => r.id === id)?.total ?? 0);
    const p = Number(paid.find((r) => r.id === id)?.total ?? 0);
    result.set(id, Math.max(o - p, 0));
  }
  return result;
}

export type StudentRow = {
  id: string;
  fullName: string;
  startPath: "free_call" | "apply_now";
  createdAt: string;
  enrolmentId: string | null;
  mentorName: string | null;
  balanceKes: number;
  nextCallAt: string | null;
};

/** Every student, newest first, with pairing, balance and next free call. */
export async function allStudents(viewer: Viewer): Promise<StudentRow[]> {
  return asUser(viewer.claims, async (tx) => {
    const rows = await tx
      .select({
        id: students.id,
        fullName: students.fullName,
        startPath: students.startPath,
        createdAt: students.createdAt,
        enrolmentId: enrolments.id,
        mentorName: mentors.fullName,
      })
      .from(students)
      // The current enrolment: newest that isn't cancelled
      .leftJoin(
        enrolments,
        and(
          eq(enrolments.studentId, students.id),
          ne(enrolments.status, "cancelled"),
          eq(
            enrolments.createdAt,
            sql`(select max(e2.created_at) from enrolments e2 where e2.student_id = ${students.id} and e2.status <> 'cancelled')`,
          ),
        ),
      )
      .leftJoin(mentors, eq(mentors.id, enrolments.mentorId))
      .orderBy(desc(students.createdAt));

    const owed = await balances(tx, rows.flatMap((r) => (r.enrolmentId ? [r.enrolmentId] : [])));
    const calls = rows.length
      ? await tx
          .select({ studentId: consultations.studentId, startsAt: slots.startsAt })
          .from(consultations)
          .innerJoin(slots, eq(slots.id, consultations.slotId))
          .where(and(eq(consultations.status, "booked"), gt(slots.startsAt, new Date())))
          .orderBy(asc(slots.startsAt))
      : [];

    return rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      balanceKes: r.enrolmentId ? (owed.get(r.enrolmentId) ?? 0) : 0,
      nextCallAt: calls.find((c) => c.studentId === r.id)?.startsAt.toISOString() ?? null,
    }));
  });
}

export type StudentDetail = {
  student: typeof students.$inferSelect;
  enrolment: (typeof enrolments.$inferSelect & { balanceKes: number }) | null;
  mentor: { id: string; fullName: string } | null;
  calls: { id: string; startsAt: string; status: string; meetLink: string | null }[];
  sessionsHeld: number;
  approvedMentors: { id: string; fullName: string; university: string; course: string; studentCount: number }[];
};

/** One student's full record, for pairing and follow-up. Logged. */
export async function studentDetail(viewer: Viewer, studentId: string): Promise<StudentDetail | null> {
  const detail = await asUser(viewer.claims, async (tx) => {
    const student = await tx.query.students.findFirst({ where: eq(students.id, studentId) });
    if (!student) return null;
    const enrolment = await tx.query.enrolments.findFirst({
      where: and(eq(enrolments.studentId, studentId), ne(enrolments.status, "cancelled")),
      orderBy: desc(enrolments.createdAt),
    });
    const owed = enrolment ? await balances(tx, [enrolment.id]) : new Map<string, number>();
    const mentor = enrolment?.mentorId
      ? await tx.query.mentors.findFirst({ where: eq(mentors.id, enrolment.mentorId), columns: { id: true, fullName: true } })
      : undefined;
    const calls = await tx
      .select({ id: consultations.id, startsAt: slots.startsAt, status: consultations.status, meetLink: consultations.meetLink })
      .from(consultations)
      .innerJoin(slots, eq(slots.id, consultations.slotId))
      .where(eq(consultations.studentId, studentId))
      .orderBy(desc(slots.startsAt));
    const [held] = enrolment
      ? await tx
          .select({ n: sql<number>`count(*)::int` })
          .from(sessions)
          .where(and(eq(sessions.enrolmentId, enrolment.id), ne(sessions.status, "cancelled"), lt(sessions.startsAt, new Date())))
      : [{ n: 0 }];

    const mentorRows = await tx
      .select({ id: mentors.id, fullName: mentors.fullName, university: mentors.university, course: mentors.course })
      .from(mentors)
      .where(eq(mentors.approved, true))
      .orderBy(asc(mentors.fullName));
    const loads = await tx
      .select({ mentorId: enrolments.mentorId, n: sql<number>`count(*)::int` })
      .from(enrolments)
      .where(inArray(enrolments.status, ["active", "pending_payment"]))
      .groupBy(enrolments.mentorId);

    return {
      student,
      enrolment: enrolment ? { ...enrolment, balanceKes: owed.get(enrolment.id) ?? 0 } : null,
      mentor: mentor ?? null,
      calls: calls.map((c) => ({ ...c, startsAt: c.startsAt.toISOString() })),
      sessionsHeld: held.n,
      approvedMentors: mentorRows.map((m) => ({ ...m, studentCount: loads.find((l) => l.mentorId === m.id)?.n ?? 0 })),
    };
  });
  if (detail) await logAccess(viewer, studentId, "view", "admin_student");
  return detail;
}

export type CallSlotRow = {
  id: string;
  startsAt: string;
  /** Still to come when loaded. */
  upcoming: boolean;
  booking: { consultationId: string; studentId: string; studentName: string; parentEmail: string; status: string; meetLink: string | null } | null;
};

/** Free call times from a week ago onwards, with who booked each. */
export async function callSlots(viewer: Viewer): Promise<CallSlotRow[]> {
  return asUser(viewer.claims, async (tx) => {
    const rows = await tx
      .select({
        id: slots.id,
        startsAt: slots.startsAt,
        consultationId: consultations.id,
        studentId: students.id,
        studentName: students.fullName,
        parentEmail: students.parentEmail,
        status: consultations.status,
        meetLink: consultations.meetLink,
      })
      .from(slots)
      .leftJoin(consultations, and(eq(consultations.slotId, slots.id), ne(consultations.status, "cancelled")))
      .leftJoin(students, eq(students.id, consultations.studentId))
      .where(gte(slots.startsAt, new Date(Date.now() - 7 * 86_400_000)))
      .orderBy(asc(slots.startsAt));
    const now = Date.now();
    return rows.map((r) => ({
      id: r.id,
      startsAt: r.startsAt.toISOString(),
      upcoming: r.startsAt.getTime() > now,
      booking:
        r.consultationId && r.studentId
          ? {
              consultationId: r.consultationId,
              studentId: r.studentId,
              studentName: r.studentName ?? "",
              parentEmail: r.parentEmail ?? "",
              status: r.status ?? "booked",
              meetLink: r.meetLink,
            }
          : null,
    }));
  });
}

export type MentorRow = typeof mentors.$inferSelect & { studentCount: number };

/** Every mentor, waiting for approval first. */
export async function allMentors(viewer: Viewer): Promise<MentorRow[]> {
  return asUser(viewer.claims, async (tx) => {
    const rows = await tx.select().from(mentors).orderBy(asc(mentors.approved), asc(mentors.fullName));
    const loads = await tx
      .select({ mentorId: enrolments.mentorId, n: sql<number>`count(*)::int` })
      .from(enrolments)
      .where(inArray(enrolments.status, ["active", "pending_payment"]))
      .groupBy(enrolments.mentorId);
    return rows.map((m) => ({ ...m, studentCount: loads.find((l) => l.mentorId === m.id)?.n ?? 0 }));
  });
}

export type PaymentRow = {
  id: string;
  studentId: string;
  studentName: string;
  amountKes: number;
  method: "mpesa" | "card";
  status: "pending" | "succeeded" | "failed";
  reference: string | null;
  at: string;
};

/** Payments, newest first, and what each student still owes. */
export async function paymentsLedger(viewer: Viewer) {
  return asUser(viewer.claims, async (tx) => {
    const rows = await tx
      .select({
        id: payments.id,
        studentId: students.id,
        studentName: students.fullName,
        amountKes: payments.amountKes,
        method: payments.method,
        status: payments.status,
        reference: payments.mpesaReference,
        providerReference: payments.providerReference,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .innerJoin(charges, eq(charges.id, payments.chargeId))
      .innerJoin(enrolments, eq(enrolments.id, charges.enrolmentId))
      .innerJoin(students, eq(students.id, enrolments.studentId))
      .orderBy(desc(payments.createdAt))
      .limit(200);

    const open = await tx
      .select({ enrolmentId: enrolments.id, studentId: students.id, studentName: students.fullName })
      .from(enrolments)
      .innerJoin(students, eq(students.id, enrolments.studentId))
      .where(ne(enrolments.status, "cancelled"));
    const owed = await balances(tx, open.map((o) => o.enrolmentId));

    return {
      payments: rows.map(
        (r): PaymentRow => ({
          id: r.id,
          studentId: r.studentId,
          studentName: r.studentName,
          amountKes: r.amountKes,
          method: r.method,
          status: r.status,
          reference: r.reference ?? r.providerReference,
          at: (r.paidAt ?? r.createdAt).toISOString(),
        }),
      ),
      outstanding: open
        .map((o) => ({ studentId: o.studentId, studentName: o.studentName, balanceKes: owed.get(o.enrolmentId) ?? 0 }))
        .filter((o) => o.balanceKes > 0)
        .sort((a, b) => b.balanceKes - a.balanceKes),
    };
  });
}
