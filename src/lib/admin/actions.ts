"use server";

import { and, desc, eq, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { adminDb, schema } from "@/db";
import { logAccess, requireViewer } from "@/lib/auth/dal";
import { serverEnv } from "@/lib/env";
import { meetLinkSchema } from "@/lib/links";
import { MENTOR_TIME_ZONES } from "./options";
import { createAdminClient } from "@/lib/supabase/admin";
import { EAT, isTimeZone, zonedToUtc } from "@/lib/time";

/**
 * Admin writes. Every action checks the caller is an admin first, then writes
 * with the server's access (the browser has no write access to any table).
 */

const SOMETHING_WRONG = "That didn't save. Please try again.";
const CALL_MINUTES = 30;

function pgCode(error: unknown): string | undefined {
  for (let e = error as { code?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.code) return e.code;
  }
}

// ---------------------------------------------------------------- pairing

export type PairState = { error?: string; paired?: number };

/** Pairs a student with an approved mentor, or moves them to another one. */
export async function pairStudent(_prev: PairState, formData: FormData): Promise<PairState> {
  const viewer = await requireViewer(["admin"]);
  const studentId = String(formData.get("studentId") ?? "");
  const mentorId = String(formData.get("mentorId") ?? "");
  if (!z.uuid().safeParse(studentId).success) return { error: SOMETHING_WRONG };
  if (!z.uuid().safeParse(mentorId).success) return { error: "Choose a mentor first." };

  const db = adminDb();
  const mentor = await db.query.mentors.findFirst({ where: eq(schema.mentors.id, mentorId) });
  if (!mentor?.approved) return { error: "Choose an approved mentor." };
  const enrolment = await db.query.enrolments.findFirst({
    where: and(eq(schema.enrolments.studentId, studentId), ne(schema.enrolments.status, "cancelled")),
    orderBy: desc(schema.enrolments.createdAt),
  });
  if (!enrolment) return { error: "This student has no enrolment to pair." };
  if (enrolment.mentorId === mentorId) return { paired: Date.now() };

  await db.transaction(async (tx) => {
    await tx
      .update(schema.enrolments)
      .set({ mentorId, pairedAt: new Date(), startsOn: enrolment.startsOn ?? new Date().toISOString().slice(0, 10) })
      .where(eq(schema.enrolments.id, enrolment.id));
    await tx.insert(schema.activityLog).values({
      studentId,
      actorProfileId: viewer.profileId,
      eventType: enrolment.mentorId ? "mentor_changed" : "paired",
      details: { mentorId, previousMentorId: enrolment.mentorId },
    });
  });
  await logAccess(viewer, studentId, "update", "pairing");
  refresh();
  return { paired: Date.now() };
}

// ---------------------------------------------------------------- free call times

export type CallTimeState = { error?: string; fieldErrors?: { date?: string; time?: string }; added?: number; skipped?: number };

/** Adds free call times in East Africa Time, optionally repeating weekly. */
export async function addCallTimes(_prev: CallTimeState, formData: FormData): Promise<CallTimeState> {
  await requireViewer(["admin"]);
  const date = String(formData.get("date") ?? "");
  const times = formData.getAll("time").map(String).filter((t) => /^\d{2}:\d{2}$/.test(t));
  const weeks = Math.min(Math.max(Number(formData.get("repeatWeeks") ?? 1) || 1, 1), 12);

  const fieldErrors: CallTimeState["fieldErrors"] = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fieldErrors.date = "Choose a day.";
  if (times.length === 0) fieldErrors.time = "Choose at least one time.";
  if (fieldErrors.date || fieldErrors.time) return { fieldErrors };

  const rows = [];
  for (let w = 0; w < weeks; w++) {
    const day = new Date(`${date}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() + w * 7);
    for (const t of times) {
      const startsAt = zonedToUtc(day.toISOString().slice(0, 10), t, EAT);
      if (startsAt.getTime() > Date.now()) rows.push({ startsAt, endsAt: new Date(startsAt.getTime() + CALL_MINUTES * 60_000) });
    }
  }
  if (rows.length === 0) return { fieldErrors: { date: "Choose a day and time that's still to come." } };

  const inserted = await adminDb()
    .insert(schema.consultationSlots)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: schema.consultationSlots.id });
  refresh();
  return { added: inserted.length, skipped: rows.length - inserted.length };
}

/** Removes a free call time nobody has booked. */
export async function removeCallTime(id: string): Promise<{ error?: string }> {
  await requireViewer(["admin"]);
  if (!z.uuid().safeParse(id).success) return { error: SOMETHING_WRONG };
  try {
    await adminDb().delete(schema.consultationSlots).where(eq(schema.consultationSlots.id, id));
  } catch (error) {
    if (pgCode(error) === "23503") return { error: "A student has booked this time, so it can't be removed." };
    throw error;
  }
  refresh();
  return {};
}

export type CallState = { error?: string; fieldErrors?: { meetLink?: string }; saved?: number };

const CALL_STATUSES = ["booked", "completed", "no_show", "cancelled"] as const;

/** Saves a free call's Meet link and how it went. */
export async function updateCall(_prev: CallState, formData: FormData): Promise<CallState> {
  const viewer = await requireViewer(["admin"]);
  const id = String(formData.get("consultationId") ?? "");
  const status = z.enum(CALL_STATUSES).safeParse(formData.get("status"));
  const link = meetLinkSchema.safeParse(String(formData.get("meetLink") ?? ""));
  if (!z.uuid().safeParse(id).success || !status.success) return { error: SOMETHING_WRONG };
  if (!link.success) return { fieldErrors: { meetLink: link.error.issues[0].message } };

  const call = await adminDb().query.consultations.findFirst({ where: eq(schema.consultations.id, id) });
  if (!call) return { error: SOMETHING_WRONG };

  await adminDb().transaction(async (tx) => {
    await tx.update(schema.consultations).set({ meetLink: link.data, status: status.data }).where(eq(schema.consultations.id, id));
    if (status.data !== call.status) {
      await tx.insert(schema.activityLog).values({
        studentId: call.studentId,
        actorProfileId: viewer.profileId,
        eventType: `consultation_${status.data}`,
        details: { consultationId: id },
      });
    }
  });
  await logAccess(viewer, call.studentId, "update", "consultation");
  refresh();
  return { saved: Date.now() };
}

// ---------------------------------------------------------------- mentors

const req = (max: number, empty: string) => z.string().trim().min(1, empty).max(max, "That's a bit long. Shorten it, please.");

const mentorSchema = z.object({
  fullName: req(120, "Enter their full name."),
  email: z.string().trim().min(1, "Enter their email.").pipe(z.email("Enter an email like name@gmail.com.")).transform((e) => e.toLowerCase()),
  university: req(120, "Enter their university."),
  course: req(120, "Enter their course."),
  yearOrStatus: req(40, "Enter the year they finished, or “Final year”."),
  currentCity: req(80, "Enter the city they live in now."),
  homeTown: req(80, "Enter their home town in Kenya."),
  bio: z.string().trim().max(600, "Keep the bio to a few sentences."),
  whatsapp: z
    .string()
    .transform((s) => s.replace(/[\s\-()]/g, ""))
    .refine((s) => s === "" || /^\+\d{8,15}$/.test(s), "Enter the number with its country code, like +44 7700 900123.")
    .transform((s) => s || null),
  timeZone: z.string().refine((tz) => MENTOR_TIME_ZONES.includes(tz) && isTimeZone(tz), "Choose their time zone."),
});

export type MentorField = keyof z.input<typeof mentorSchema>;
export type AddMentorState = {
  values?: Record<string, string>;
  fieldErrors?: Partial<Record<MentorField, string>>;
  error?: string;
  added?: { name: string; emailSent: boolean };
};

/** Adds a mentor: their login (no password yet), their profile, and an email to choose a password. */
export async function addMentor(_prev: AddMentorState, formData: FormData): Promise<AddMentorState> {
  await requireViewer(["admin"]);
  const keys = Object.keys(mentorSchema.shape) as MentorField[];
  const values = Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
  const approved = formData.get("approved") === "yes";

  const parsed = mentorSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: AddMentorState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as MentorField] ??= issue.message;
    return { values, fieldErrors };
  }
  const m = parsed.data;

  const db = adminDb();
  if (await db.query.profiles.findFirst({ where: eq(schema.profiles.email, m.email) })) {
    return { values, fieldErrors: { email: "Someone already has a Njia account with this email." } };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: m.email,
    email_confirm: true,
    app_metadata: { role: "mentor" },
    user_metadata: { full_name: m.fullName },
  });
  if (error || !data.user) {
    if (error?.code === "email_exists") return { values, fieldErrors: { email: "Someone already has a Njia account with this email." } };
    console.error("admin: mentor createUser failed", error?.code ?? error?.status);
    return { values, error: SOMETHING_WRONG };
  }

  try {
    await db.insert(schema.mentors).values({ profileId: data.user.id, ...m, approved });
  } catch (e) {
    await supabase.auth.admin.deleteUser(data.user.id).catch(() => {});
    console.error("admin: mentor insert failed", pgCode(e));
    return { values, error: SOMETHING_WRONG };
  }

  const { error: mailError } = await supabase.auth.resetPasswordForEmail(m.email, {
    redirectTo: `${serverEnv().NEXT_PUBLIC_SITE_URL}/auth/confirm`,
  });
  if (mailError) console.error("admin: mentor password email failed", mailError.code ?? mailError.status);
  refresh();
  return { added: { name: m.fullName, emailSent: !mailError } };
}

/** Shows or hides a mentor. Students only ever see approved mentors. */
export async function setMentorApproved(mentorId: string, approved: boolean): Promise<{ error?: string }> {
  await requireViewer(["admin"]);
  if (!z.uuid().safeParse(mentorId).success) return { error: SOMETHING_WRONG };
  await adminDb().update(schema.mentors).set({ approved }).where(eq(schema.mentors.id, mentorId));
  refresh();
  return {};
}
