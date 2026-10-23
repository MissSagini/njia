"use server";

import { eq } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";
import { adminDb, schema } from "@/db";
import { paystackEnv, serverEnv } from "@/lib/env";
import { payPath } from "@/lib/payments/link";
import { goalsSchema, START_PATHS, type Goals, type GoalsField, type StartPath } from "@/lib/goals";
import { calendarConnected, createMeetEvent } from "@/lib/google/calendar";
import { createAdminClient } from "@/lib/supabase/admin";
import { activePackage, isSlotOpen } from "./data";

export type GoalsState = {
  /** What was typed, so the form keeps it after an error. */
  values?: Record<string, string>;
  fieldErrors?: Partial<Record<GoalsField | "slotId" | "consent", string>>;
  error?: string;
  /** The email belongs to an existing account. */
  emailTaken?: boolean;
  /** A call time someone else booked while this form was open. */
  takenSlotId?: string;
  done?: { path: StartPath; email: string; callStartsAt?: string; emailSent: boolean; inviteSent?: boolean; payUrl?: string };
};

const SOMETHING_WRONG = "We couldn't save your goals just now. Please try again in a few minutes.";
const EMAIL_TAKEN = "This email already has a Njia account. Log in to see your mentor and sessions.";
const SLOT_TAKEN = "Someone just booked that call time. Choose another one.";

/** Postgres unique violation on the given constraint, however the driver wraps it. */
function isUniqueViolation(error: unknown, constraint: string): boolean {
  for (let e = error as { code?: string; constraint_name?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.code === "23505" && e.constraint_name === constraint) return true;
  }
  return false;
}

/**
 * Get started: saves the student's goals and, on the free-call path, books the
 * call. Creates the student's login (no password yet), student record,
 * enrolment and first charge. Nobody is signed in, so every check happens here.
 */
export async function submitGoals(_prev: GoalsState, formData: FormData): Promise<GoalsState> {
  const raw = Object.fromEntries(
    ["fullName", "email", "phone", "school", "examType", "courseInterest", "helpNeeded", "parentName", "parentEmail", "path", "slotId"].map(
      (k) => [k, String(formData.get(k) ?? "")],
    ),
  );
  const universities = formData.getAll("dreamUniversities").map(String);
  const values = { ...raw, dreamUniversities: universities.join("\n") };

  // Bots fill in every field, including this hidden one
  if (formData.get("website")) return { done: { path: START_PATHS.call, email: raw.email, emailSent: true } };

  const path: StartPath = raw.path === START_PATHS.apply ? START_PATHS.apply : START_PATHS.call;
  const parsed = goalsSchema.safeParse({ ...raw, dreamUniversities: universities });
  const fieldErrors: GoalsState["fieldErrors"] = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as GoalsField;
      fieldErrors[key] ??= issue.message;
    }
  }
  if (path === START_PATHS.call && !z.uuid().safeParse(raw.slotId).success) fieldErrors.slotId = "Choose a time for your call.";
  if (formData.get("consent") !== "yes") fieldErrors.consent = "Your parent or guardian needs to agree before we can save your details.";
  if (!parsed.success || Object.keys(fieldErrors).length) return { values, fieldErrors };
  const goals = parsed.data;

  try {
    serverEnv();
  } catch {
    return { values, error: SOMETHING_WRONG };
  }

  const existing = await adminDb().query.profiles.findFirst({ where: eq(schema.profiles.email, goals.email) });
  if (existing) {
    return { values, emailTaken: true, fieldErrors: { email: EMAIL_TAKEN } };
  }

  if (path === START_PATHS.call && !(await isSlotOpen(raw.slotId))) {
    return { values, takenSlotId: raw.slotId, fieldErrors: { slotId: SLOT_TAKEN } };
  }

  const pkg = await activePackage();
  if (!pkg) {
    console.error("get-started: no active package");
    return { values, error: SOMETHING_WRONG };
  }

  // The login comes first: students.profile_id needs it. The trigger adds the profile.
  const supabase = createAdminClient();
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: goals.email,
    email_confirm: true,
    app_metadata: { role: "student" },
    user_metadata: { full_name: goals.fullName },
  });
  if (createError?.code === "email_exists") {
    return { values, emailTaken: true, fieldErrors: { email: EMAIL_TAKEN } };
  }
  if (createError || !created.user) {
    console.error("get-started: createUser failed", createError?.code ?? createError?.status);
    return { values, error: SOMETHING_WRONG };
  }
  const profileId = created.user.id;

  let call: { consultationId: string; startsAt: Date; endsAt: Date } | undefined;
  let enrolmentId: string;
  try {
    ({ call, enrolmentId } = await adminDb().transaction(async (tx) => {
      const now = new Date();
      const [student] = await tx
        .insert(schema.students)
        .values({ profileId, ...goals, startPath: path, parentalConsentAt: now })
        .returning({ id: schema.students.id });

      const [enrolment] = await tx
        .insert(schema.enrolments)
        .values({ studentId: student.id, packageName: pkg.name, priceKes: pkg.priceKes, weeks: pkg.weeks })
        .returning({ id: schema.enrolments.id });

      await tx.insert(schema.charges).values({
        enrolmentId: enrolment.id,
        description: pkg.name,
        amountKes: pkg.priceKes,
        dueOn: now.toISOString().slice(0, 10),
      });

      const events: (typeof schema.activityLog.$inferInsert)[] = [
        { studentId: student.id, actorProfileId: profileId, eventType: "goals_submitted", details: { startPath: path } },
      ];

      let booked: typeof call;
      if (path === START_PATHS.call) {
        const [consultation] = await tx
          .insert(schema.consultations)
          .values({ studentId: student.id, slotId: raw.slotId })
          .returning({ id: schema.consultations.id });
        const slot = await tx.query.consultationSlots.findFirst({ where: eq(schema.consultationSlots.id, raw.slotId) });
        if (!slot) throw new Error("slot vanished");
        booked = { consultationId: consultation.id, startsAt: slot.startsAt, endsAt: slot.endsAt };
        events.push({
          studentId: student.id,
          actorProfileId: profileId,
          eventType: "consultation_booked",
          details: { consultationId: consultation.id, startsAt: slot.startsAt.toISOString() },
        });
      }

      await tx.insert(schema.activityLog).values(events);
      return { call: booked, enrolmentId: enrolment.id };
    }));
  } catch (error) {
    // Nothing was saved, so remove the login too and let them try again
    await supabase.auth.admin.deleteUser(profileId).catch(() => {});
    if (isUniqueViolation(error, "consultations_live_slot_key")) {
      return { values, takenSlotId: raw.slotId, fieldErrors: { slotId: SLOT_TAKEN } };
    }
    if (isUniqueViolation(error, "students_email_unique")) {
      return { values, emailTaken: true, fieldErrors: { email: EMAIL_TAKEN } };
    }
    console.error("get-started: save failed", (error as { code?: string }).code);
    return { values, error: SOMETHING_WRONG };
  }

  // Everyone can log in straight away, so someone who leaves before paying can come back and pay on My mentor
  const { error: mailError } = await supabase.auth.resetPasswordForEmail(goals.email, {
    redirectTo: `${serverEnv().NEXT_PUBLIC_SITE_URL}/auth/confirm`,
  });
  const emailSent = !mailError;
  if (mailError) console.error("get-started: password email failed", mailError.code ?? mailError.status);

  const inviteSent = !!call && calendarConnected();
  if (call && inviteSent) {
    const booked = call;
    // After the response, so a slow calendar never holds up "You're booked!"
    after(() => inviteToCall(booked, goals));
  }

  // Apply now: straight on to payment, when payments are switched on
  const payUrl = path === START_PATHS.apply && paystackEnv() ? payPath(enrolmentId) : undefined;
  return { done: { path, email: goals.email, callStartsAt: call?.startsAt.toISOString(), emailSent, inviteSent, payUrl } };
}

/** Creates the Meet link and emails the calendar invite to the student and parent. */
async function inviteToCall(call: { consultationId: string; startsAt: Date; endsAt: Date }, goals: Goals) {
  try {
    const { eventId, meetLink } = await createMeetEvent({
      requestId: call.consultationId,
      summary: `Njia free call with ${goals.fullName}`,
      description:
        "Your free 30-minute call with the Njia team. We'll talk about your goals, your universities and how a mentor can help. Parents are welcome to join.",
      startsAt: call.startsAt,
      endsAt: call.endsAt,
      attendees: [goals.email, goals.parentEmail],
    });
    await adminDb()
      .update(schema.consultations)
      .set({ meetLink, calendarEventId: eventId })
      .where(eq(schema.consultations.id, call.consultationId));
  } catch (error) {
    // The booking stands; the team can add the link by hand
    console.error("get-started: calendar invite failed", (error as Error).message);
  }
}
