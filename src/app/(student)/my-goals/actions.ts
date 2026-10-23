"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { adminDb, asUser, schema } from "@/db";
import { requireViewer } from "@/lib/auth/dal";
import { editGoalsSchema, PARENT_EMAIL_DIFFERENT, type EditableGoalsField } from "@/lib/goals";

export type EditGoalsState = {
  values?: Record<string, string>;
  fieldErrors?: Partial<Record<EditableGoalsField, string>>;
  error?: string;
  saved?: number;
};

/** The student updates their course, exams, universities and parent's details. */
export async function updateGoals(_prev: EditGoalsState, formData: FormData): Promise<EditGoalsState> {
  const viewer = await requireViewer(["student"]);
  const raw = Object.fromEntries(
    ["examType", "courseInterest", "parentName", "parentEmail"].map((k) => [k, String(formData.get(k) ?? "")]),
  );
  const universities = formData.getAll("dreamUniversities").map(String);
  const values = { ...raw, dreamUniversities: universities.join("\n") };

  const parsed = editGoalsSchema.safeParse({ ...raw, dreamUniversities: universities });
  if (!parsed.success) {
    const fieldErrors: EditGoalsState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as EditableGoalsField] ??= issue.message;
    return { values, fieldErrors };
  }
  const goals = parsed.data;

  const student = await asUser(viewer.claims, (tx) =>
    tx.query.students.findFirst({ where: eq(schema.students.profileId, viewer.profileId) }),
  );
  if (!student) return { values, error: "We couldn't find your goals. Message us at hello@njia.co.ke." };
  if (goals.parentEmail === student.email) return { values, fieldErrors: { parentEmail: PARENT_EMAIL_DIFFERENT } };

  // Record which fields changed, not their values
  const changed = (Object.keys(goals) as (keyof typeof goals)[]).filter(
    (k) => JSON.stringify(goals[k]) !== JSON.stringify(student[k]),
  );
  if (changed.length === 0) return { saved: Date.now() };

  try {
    await adminDb().transaction(async (tx) => {
      await tx.update(schema.students).set(goals).where(eq(schema.students.id, student.id));
      await tx.insert(schema.activityLog).values({
        studentId: student.id,
        actorProfileId: viewer.profileId,
        eventType: "goals_updated",
        details: { fields: changed },
      });
    });
  } catch (error) {
    console.error("my-goals: save failed", (error as { code?: string }).code);
    return { values, error: "Your changes didn't save. Please try again." };
  }
  refresh();
  return { saved: Date.now() };
}
