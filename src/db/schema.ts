/**
 * Njia database schema (Supabase Postgres).
 *
 * Every table has Row Level Security on. The read rules (policies), helper
 * functions, triggers and grants live in hand-written SQL migrations under
 * drizzle/, because they depend on Supabase's auth schema.
 *
 * Money is whole Kenyan shillings (integer). Times are timestamptz (UTC).
 */
import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ---------------------------------------------------------------- enums

export const userRole = pgEnum("user_role", ["student", "mentor", "admin"]);
export const startPath = pgEnum("start_path", ["free_call", "apply_now"]);
export const consultationStatus = pgEnum("consultation_status", ["booked", "completed", "cancelled", "no_show"]);
export const enrolmentStatus = pgEnum("enrolment_status", ["pending_payment", "active", "completed", "cancelled"]);
export const paymentMethod = pgEnum("payment_method", ["mpesa", "card", "bank_transfer", "cash"]);
export const paymentStatus = pgEnum("payment_status", ["pending", "succeeded", "failed"]);
export const sessionStatus = pgEnum("session_status", ["scheduled", "held", "missed", "cancelled"]);
export const programmeStage = pgEnum("programme_stage", [
  "course_choice",
  "personal_statement",
  "application",
  "offers",
  "visa",
  "accommodation",
  "arrival",
]);
export const accessAction = pgEnum("access_action", ["view", "update"]);

// ---------------------------------------------------------------- people

/** One row per login. Created by a trigger when Supabase creates the auth user. */
export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  role: userRole("role").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  ...timestamps,
}).enableRLS();

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull().unique(),
    /** E.164, e.g. +254712345678 */
    phone: text("phone").notNull(),
    school: text("school"),
    examType: text("exam_type").notNull(),
    courseInterest: text("course_interest").notNull(),
    dreamUniversities: text("dream_universities").array().notNull().default(sql`'{}'::text[]`),
    helpNeeded: text("help_needed").notNull(),
    parentName: text("parent_name").notNull(),
    parentEmail: text("parent_email").notNull(),
    startPath: startPath("start_path").notNull(),
    /** When the parent consented to Njia processing the student's data (students are often minors). */
    parentalConsentAt: timestamp("parental_consent_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [check("dream_universities_max_5", sql`cardinality(${t.dreamUniversities}) <= 5`)],
).enableRLS();

export const mentors = pgTable("mentors", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  university: text("university").notNull(),
  course: text("course").notNull(),
  /** "2022" or "Final year" */
  yearOrStatus: text("year_or_status").notNull(),
  currentCity: text("current_city").notNull(),
  homeTown: text("home_town").notNull(),
  bio: text("bio").notNull().default(""),
  /** E.164, used for wa.me links */
  whatsapp: text("whatsapp"),
  /** IANA zone, e.g. Europe/London, for showing times in the mentor's local time */
  timeZone: text("time_zone").notNull().default("Europe/London"),
  approved: boolean("approved").notNull().default(false),
  ...timestamps,
}).enableRLS();

// ---------------------------------------------------------------- booking

/** Free consultation call times offered by the Njia team. */
export const consultationSlots = pgTable(
  "consultation_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [uniqueIndex("consultation_slots_starts_at_key").on(t.startsAt), check("slot_order", sql`${t.endsAt} > ${t.startsAt}`)],
).enableRLS();

export const consultations = pgTable(
  "consultations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => consultationSlots.id),
    status: consultationStatus("status").notNull().default("booked"),
    meetLink: text("meet_link"),
    /** Google Calendar event, for moving or cancelling the call later */
    calendarEventId: text("calendar_event_id"),
    ...timestamps,
  },
  // A slot can hold only one live booking: the "time was just booked" error comes from this index
  (t) => [uniqueIndex("consultations_live_slot_key").on(t.slotId).where(sql`${t.status} <> 'cancelled'`)],
).enableRLS();

/** Times a mentor is free for their next session with a student. */
export const mentorAvailability = pgTable(
  "mentor_availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mentorId: uuid("mentor_id")
      .notNull()
      .references(() => mentors.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    uniqueIndex("mentor_availability_mentor_start_key").on(t.mentorId, t.startsAt),
    check("availability_order", sql`${t.endsAt} > ${t.startsAt}`),
  ],
).enableRLS();

// ---------------------------------------------------------------- money (ledger)

/** What Njia sells. New enrolments copy the active package's name, price and length. */
export const packages = pgTable(
  "packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    priceKes: integer("price_kes").notNull(),
    weeks: smallint("weeks").notNull(),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [check("package_price_positive", sql`${t.priceKes} > 0`)],
).enableRLS();

/** A student's mentorship package. The agreed price lives here, never in code. */
export const enrolments = pgTable(
  "enrolments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    packageName: text("package_name").notNull(),
    priceKes: integer("price_kes").notNull(),
    weeks: smallint("weeks").notNull().default(12),
    status: enrolmentStatus("status").notNull().default("pending_payment"),
    mentorId: uuid("mentor_id").references(() => mentors.id),
    pairedAt: timestamp("paired_at", { withTimezone: true }),
    startsOn: date("starts_on"),
    ...timestamps,
  },
  (t) => [check("price_positive", sql`${t.priceKes} > 0`), index("enrolments_mentor_idx").on(t.mentorId)],
).enableRLS();

/** An amount owed and when. Deposits and instalments are just more charges. */
export const charges = pgTable(
  "charges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrolmentId: uuid("enrolment_id")
      .notNull()
      .references(() => enrolments.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amountKes: integer("amount_kes").notNull(),
    dueOn: date("due_on").notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [check("charge_positive", sql`${t.amountKes} > 0`)],
).enableRLS();

/**
 * A real M-Pesa or card transaction against a charge. A charge can take several
 * payments (M-Pesa limits). Balance owed = charges minus succeeded payments; never stored.
 */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chargeId: uuid("charge_id")
      .notNull()
      .references(() => charges.id),
    amountKes: integer("amount_kes").notNull(),
    method: paymentMethod("method").notNull(),
    status: paymentStatus("status").notNull().default("pending"),
    /** Phone the M-Pesa prompt went to (student's or parent's), E.164 */
    mpesaPhone: text("mpesa_phone"),
    /** M-Pesa receipt number from the Daraja callback */
    mpesaReference: text("mpesa_reference").unique(),
    /** Daraja CheckoutRequestID or Paystack reference, for matching callbacks */
    providerReference: text("provider_reference").unique(),
    failureReason: text("failure_reason"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    /** Set when an admin recorded a payment made outside Paystack (bank transfer, cash, direct M-Pesa). */
    recordedBy: uuid("recorded_by").references(() => profiles.id, { onDelete: "set null" }),
    /** The admin's note for a recorded payment, such as the bank's reference. */
    note: text("note"),
    ...timestamps,
  },
  (t) => [check("payment_positive", sql`${t.amountKes} > 0`), index("payments_charge_idx").on(t.chargeId)],
).enableRLS();

// ---------------------------------------------------------------- progress

/** The 12 programme weeks, each tied to a stage. Seeded by migration. */
export const programmeWeeks = pgTable("programme_weeks", {
  weekNumber: smallint("week_number").primaryKey(),
  stage: programmeStage("stage").notNull(),
  title: text("title").notNull(),
}).enableRLS();

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrolmentId: uuid("enrolment_id")
      .notNull()
      .references(() => enrolments.id, { onDelete: "cascade" }),
    mentorId: uuid("mentor_id")
      .notNull()
      .references(() => mentors.id),
    weekNumber: smallint("week_number").references(() => programmeWeeks.weekNumber),
    availabilityId: uuid("availability_id")
      .unique()
      .references(() => mentorAvailability.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    status: sessionStatus("status").notNull().default("scheduled"),
    meetLink: text("meet_link"),
    calendarEventId: text("calendar_event_id"),
    mentorNotes: text("mentor_notes"),
    ...timestamps,
  },
  (t) => [index("sessions_enrolment_idx").on(t.enrolmentId), index("sessions_mentor_idx").on(t.mentorId)],
).enableRLS();

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    position: smallint("position").notNull().default(0),
    done: boolean("done").notNull().default(false),
    doneAt: timestamp("done_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("tasks_session_idx").on(t.sessionId)],
).enableRLS();

// ---------------------------------------------------------------- audit (append-only)

/** Every event in a student's journey. Rows are never updated or deleted (enforced by trigger). */
export const activityLog = pgTable(
  "activity_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    actorProfileId: uuid("actor_profile_id").references(() => profiles.id, { onDelete: "set null" }),
    eventType: text("event_type").notNull(),
    details: jsonb("details").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("activity_log_student_idx").on(t.studentId, t.createdAt)],
).enableRLS();

/** Who viewed or changed which student's records. Append-only. */
export const accessLog = pgTable(
  "access_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorProfileId: uuid("actor_profile_id").references(() => profiles.id, { onDelete: "set null" }),
    studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }),
    action: accessAction("action").notNull(),
    resource: text("resource").notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("access_log_student_idx").on(t.studentId, t.createdAt)],
).enableRLS();
