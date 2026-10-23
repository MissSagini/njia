import { z } from "zod";

/** The goals form, shared by Get started and My goals. Safe to import in the browser. */

export const EXAM_TYPES = ["A-levels", "IB Diploma", "KCSE", "Other"] as const;

/** Suggestions only: students can add any UK or European university. */
export const UNIVERSITY_SUGGESTIONS = [
  "Oxford",
  "Cambridge",
  "LSE",
  "UCL",
  "Imperial",
  "King's College London",
  "Edinburgh",
  "Warwick",
  "St Andrews",
  "Durham",
  "Manchester",
  "Trinity College Dublin",
  "Sciences Po",
  "TU Delft",
] as const;

export const MAX_UNIVERSITIES = 5;

export const START_PATHS = { call: "free_call", apply: "apply_now" } as const;
export type StartPath = (typeof START_PATHS)[keyof typeof START_PATHS];

/** Turns 0712 345 678, 712345678, 254712345678 or +254 712 345 678 into +254712345678. Null if it isn't a Kenyan mobile number. */
export function normaliseKenyanPhone(input: string): string | null {
  let digits = input.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("254")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return /^[17]\d{8}$/.test(digits) ? `+254${digits}` : null;
}

const text = (max: number, empty: string) => z.string().trim().min(1, empty).max(max, "That's a bit long. Shorten it, please.");

export const goalsSchema = z
  .object({
    fullName: text(120, "Enter your full name."),
    email: z
      .string()
      .trim()
      .min(1, "Enter your email address.")
      .pipe(z.email("Enter an email like cynthia@gmail.com."))
      .transform((e) => e.toLowerCase()),
    phone: z
      .string()
      .trim()
      .min(1, "Enter your phone number.")
      .transform((p, ctx) => {
        const e164 = normaliseKenyanPhone(p);
        if (!e164) {
          ctx.addIssue({ code: "custom", message: "Enter a Kenyan mobile number, like 0712 345 678." });
          return z.NEVER;
        }
        return e164;
      }),
    school: z.string().trim().max(120, "That's a bit long. Shorten it, please.").optional().transform((s) => s || null),
    examType: z.enum(EXAM_TYPES, "Choose the exams you're taking."),
    courseInterest: text(120, "Tell us which course you'd like to study."),
    dreamUniversities: z
      .array(z.string().trim().min(1).max(80))
      .min(1, "Choose at least one university.")
      .max(MAX_UNIVERSITIES, `Choose up to ${MAX_UNIVERSITIES} universities.`)
      .transform((list) => [...new Set(list)]),
    helpNeeded: text(2000, "Tell us what you'd like help with."),
    parentName: text(120, "Enter your parent or guardian's name."),
    parentEmail: z
      .string()
      .trim()
      .min(1, "Enter your parent or guardian's email.")
      .pipe(z.email("Enter an email like parent@gmail.com."))
      .transform((e) => e.toLowerCase()),
  })
  .refine((g) => g.parentEmail !== g.email, {
    path: ["parentEmail"],
    message: "Use your parent's own email, so they get the weekly report.",
  });

export type Goals = z.output<typeof goalsSchema>;
export type GoalsField = keyof z.input<typeof goalsSchema>;
