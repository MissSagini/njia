import "server-only";
import { eq } from "drizzle-orm";
import { asUser, schema } from "@/db";
import { logAccess, type Viewer } from "@/lib/auth/dal";

export type StudentGoals = {
  fullName: string;
  email: string;
  phone: string;
  school: string | null;
  examType: string;
  courseInterest: string;
  dreamUniversities: string[];
  helpNeeded: string;
  parentName: string;
  parentEmail: string;
  updatedAt: string;
};

const columns = {
  fullName: true,
  email: true,
  phone: true,
  school: true,
  examType: true,
  courseInterest: true,
  dreamUniversities: true,
  helpNeeded: true,
  parentName: true,
  parentEmail: true,
  updatedAt: true,
} as const;

/** The signed-in student's own goals. */
export async function myGoals(viewer: Viewer): Promise<StudentGoals | null> {
  const row = await asUser(viewer.claims, (tx) =>
    tx.query.students.findFirst({ where: eq(schema.students.profileId, viewer.profileId), columns }),
  );
  return row ? { ...row, updatedAt: row.updatedAt.toISOString() } : null;
}

/** A paired student's goals, for their mentor. RLS returns nothing for anyone else. Logged. */
export async function menteeGoals(viewer: Viewer, studentId: string): Promise<StudentGoals | null> {
  const row = await asUser(viewer.claims, (tx) => tx.query.students.findFirst({ where: eq(schema.students.id, studentId), columns }));
  if (!row) return null;
  await logAccess(viewer, studentId, "view", "goals");
  return { ...row, updatedAt: row.updatedAt.toISOString() };
}
