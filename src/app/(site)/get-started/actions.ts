"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminDb, schema } from "@/db";
import { serverEnv } from "@/lib/env";
import { goalsSchema, START_PATHS, type GoalsField, type StartPath } from "@/lib/goals";
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
  done?: { path: StartPath; email: string; callStartsAt?: string; emailSent: boolean };
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

  let callStartsAt: string | undefined;
  try {
    callStartsAt = await adminDb().transaction(async (tx) => {
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

      let startsAt: string | undefined;
      if (path === START_PATHS.call) {
        const [consultation] = await tx
          .insert(schema.consultations)
          .values({ studentId: student.id, slotId: raw.slotId })
          .returning({ id: schema.consultations.id });
        const slot = await tx.query.consultationSlots.findFirst({ where: eq(schema.consultationSlots.id, raw.slotId) });
        startsAt = slot?.startsAt.toISOString();
        events.push({
          studentId: student.id,
          actorProfileId: profileId,
          eventType: "consultation_booked",
          details: { consultationId: consultation.id, startsAt },
        });
      }

      await tx.insert(schema.activityLog).values(events);
      return startsAt;
    });
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

  // Free-call students can log in straight away. Apply-now students get this email once they've paid.
  let emailSent = false;
  if (path === START_PATHS.call) {
    const { error } = await supabase.auth.resetPasswordForEmail(goals.email, {
      redirectTo: `${serverEnv().NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    });
    emailSent = !error;
    if (error) console.error("get-started: password email failed", error.code ?? error.status);
  }

  return { done: { path, email: goals.email, callStartsAt, emailSent } };
}
