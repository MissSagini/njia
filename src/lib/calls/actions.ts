"use server";

import { and, asc, eq, gt } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { adminDb, asUser, schema } from "@/db";
import { requireViewer, type Viewer } from "@/lib/auth/dal";
import { CALL_CHANGE_NOTICE_HOURS, isSlotOpen } from "./data";

const SOMETHING_WRONG = "That didn't save. Please try again.";
const TOO_LATE = `Your call is less than ${CALL_CHANGE_NOTICE_HOURS} hours away, so message us at hello@njia.co.ke instead.`;
const TAKEN = "Someone just booked that time. Choose another one.";

function isUniqueViolation(error: unknown, constraint: string): boolean {
  for (let e = error as { code?: string; constraint_name?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.code === "23505" && e.constraint_name === constraint) return true;
  }
  return false;
}

/** The signed-in student's upcoming free call, if it's far enough off to change. */
async function myUpcomingCall(viewer: Viewer) {
  return asUser(viewer.claims, async (tx) => {
    const student = await tx.query.students.findFirst({ where: eq(schema.students.profileId, viewer.profileId) });
    if (!student) return null;
    const [call] = await tx
      .select({ id: schema.consultations.id, startsAt: schema.consultationSlots.startsAt })
      .from(schema.consultations)
      .innerJoin(schema.consultationSlots, eq(schema.consultationSlots.id, schema.consultations.slotId))
      .where(and(eq(schema.consultations.studentId, student.id), eq(schema.consultations.status, "booked"), gt(schema.consultationSlots.startsAt, new Date())))
      .orderBy(asc(schema.consultationSlots.startsAt))
      .limit(1);
    return call ? { ...call, studentId: student.id } : null;
  });
}

const tooLate = (startsAt: Date) => startsAt.getTime() <= Date.now() + CALL_CHANGE_NOTICE_HOURS * 3_600_000;

export type MoveCallState = { error?: string; takenId?: string; bookedAt?: string };

/** The student moves their free call to another open time. */
export async function changeCall(_prev: MoveCallState, formData: FormData): Promise<MoveCallState> {
  const viewer = await requireViewer(["student"]);
  const slotId = String(formData.get("slotId") ?? "");
  if (!z.uuid().safeParse(slotId).success) return { error: "Choose a new time first." };
  const call = await myUpcomingCall(viewer);
  if (!call) return { error: SOMETHING_WRONG };
  if (tooLate(call.startsAt)) return { error: TOO_LATE };
  if (!(await isSlotOpen(slotId))) return { takenId: slotId, error: TAKEN };

  try {
    const startsAt = await adminDb().transaction(async (tx) => {
      const slot = await tx.query.consultationSlots.findFirst({ where: eq(schema.consultationSlots.id, slotId) });
      if (!slot) throw new Error("slot vanished");
      // A new time needs a new Meet link, which the team adds
      await tx.update(schema.consultations).set({ slotId, meetLink: null, calendarEventId: null }).where(eq(schema.consultations.id, call.id));
      await tx.insert(schema.activityLog).values({
        studentId: call.studentId,
        actorProfileId: viewer.profileId,
        eventType: "consultation_moved",
        details: { consultationId: call.id, from: call.startsAt.toISOString(), to: slot.startsAt.toISOString() },
      });
      return slot.startsAt;
    });
    refresh();
    return { bookedAt: startsAt.toISOString() };
  } catch (error) {
    if (isUniqueViolation(error, "consultations_live_slot_key")) return { takenId: slotId, error: TAKEN };
    console.error("calls: move failed", (error as { code?: string }).code);
    return { error: SOMETHING_WRONG };
  }
}

/** The student cancels their free call. The time goes back on offer. */
export async function cancelCall(): Promise<{ error?: string }> {
  const viewer = await requireViewer(["student"]);
  const call = await myUpcomingCall(viewer);
  if (!call) return { error: SOMETHING_WRONG };
  if (tooLate(call.startsAt)) return { error: TOO_LATE };

  await adminDb().transaction(async (tx) => {
    await tx.update(schema.consultations).set({ status: "cancelled" }).where(eq(schema.consultations.id, call.id));
    await tx.insert(schema.activityLog).values({
      studentId: call.studentId,
      actorProfileId: viewer.profileId,
      eventType: "consultation_cancelled",
      details: { consultationId: call.id, by: "student" },
    });
  });
  refresh();
  return {};
}
