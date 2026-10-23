import "server-only";
import { and, asc, desc, eq, gt, inArray, ne, sum } from "drizzle-orm";
import { asUser, schema } from "@/db";
import type { Viewer } from "@/lib/auth/dal";

export type MyMentorData = {
  firstName: string;
  enrolmentId: string | null;
  startPath: "free_call" | "apply_now";
  mentor: {
    fullName: string;
    university: string;
    course: string;
    yearOrStatus: string;
    homeTown: string;
    currentCity: string;
    bio: string;
    whatsapp: string | null;
    email: string;
  } | null;
  /** Charges minus succeeded payments, in shillings. Never stored. */
  balanceKes: number;
  /** The free call, if it's still to come. */
  upcomingCall: { startsAt: string; meetLink: string | null } | null;
  nextSession: { startsAt: string; meetLink: string | null } | null;
};

/** Everything on the My mentor screen, read as the student so RLS applies. */
export async function myMentor(viewer: Viewer): Promise<MyMentorData | null> {
  return asUser(viewer.claims, async (tx) => {
    const student = await tx.query.students.findFirst({ where: eq(schema.students.profileId, viewer.profileId) });
    if (!student) return null;

    const enrolment = await tx.query.enrolments.findFirst({
      where: and(eq(schema.enrolments.studentId, student.id), ne(schema.enrolments.status, "cancelled")),
      orderBy: desc(schema.enrolments.createdAt),
    });

    // RLS only shows an approved mentor who is paired with this student
    const mentor = enrolment?.mentorId
      ? await tx.query.mentors.findFirst({ where: eq(schema.mentors.id, enrolment.mentorId) })
      : undefined;

    let balanceKes = 0;
    if (enrolment) {
      const { charges, payments } = schema;
      const [owed] = await tx.select({ total: sum(charges.amountKes) }).from(charges).where(eq(charges.enrolmentId, enrolment.id));
      const [paid] = await tx
        .select({ total: sum(payments.amountKes) })
        .from(payments)
        .innerJoin(charges, eq(charges.id, payments.chargeId))
        .where(and(eq(charges.enrolmentId, enrolment.id), eq(payments.status, "succeeded")));
      balanceKes = Math.max(Number(owed?.total ?? 0) - Number(paid?.total ?? 0), 0);
    }

    const now = new Date();
    const call = await tx
      .select({ startsAt: schema.consultationSlots.startsAt, meetLink: schema.consultations.meetLink })
      .from(schema.consultations)
      .innerJoin(schema.consultationSlots, eq(schema.consultationSlots.id, schema.consultations.slotId))
      .where(and(eq(schema.consultations.studentId, student.id), eq(schema.consultations.status, "booked"), gt(schema.consultationSlots.startsAt, now)))
      .orderBy(asc(schema.consultationSlots.startsAt))
      .limit(1);

    const session = enrolment
      ? await tx.query.sessions.findFirst({
          where: and(eq(schema.sessions.enrolmentId, enrolment.id), inArray(schema.sessions.status, ["scheduled"]), gt(schema.sessions.startsAt, now)),
          orderBy: asc(schema.sessions.startsAt),
        })
      : undefined;

    return {
      firstName: student.fullName.split(" ")[0],
      enrolmentId: enrolment?.id ?? null,
      startPath: student.startPath,
      mentor: mentor
        ? {
            fullName: mentor.fullName,
            university: mentor.university,
            course: mentor.course,
            yearOrStatus: mentor.yearOrStatus,
            homeTown: mentor.homeTown,
            currentCity: mentor.currentCity,
            bio: mentor.bio,
            whatsapp: mentor.whatsapp,
            email: mentor.email,
          }
        : null,
      balanceKes,
      upcomingCall: call[0] ? { startsAt: call[0].startsAt.toISOString(), meetLink: call[0].meetLink } : null,
      nextSession: session ? { startsAt: session.startsAt.toISOString(), meetLink: session.meetLink } : null,
    };
  });
}
