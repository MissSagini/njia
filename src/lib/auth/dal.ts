import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminDb, asUser, schema, type JwtClaims } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { homeFor, type Role } from "./roles";

/**
 * Data Access Layer for identity. Every signed-in page and Server Action gets
 * the user from here, never from the client.
 */
export type Viewer = {
  profileId: string;
  role: Role;
  email: string;
  fullName: string | null;
  initials: string;
  claims: JwtClaims;
};

export function initialsFor(name: string | null, email: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

/** The signed-in user, or null. Verifies the session JWT; reads the role from the database. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as JwtClaims | undefined;
  if (!claims?.sub) return null;

  const profile = await asUser(claims, (tx) =>
    tx.query.profiles.findFirst({ where: eq(schema.profiles.id, claims.sub) }),
  );
  if (!profile) return null;

  return {
    profileId: profile.id,
    role: profile.role,
    email: profile.email,
    fullName: profile.fullName,
    initials: initialsFor(profile.fullName, profile.email),
    claims,
  };
});

/**
 * The signed-in user if they may use this area; otherwise redirects to log in
 * or to their own home.
 */
export async function requireViewer(roles: readonly Role[]): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  if (!roles.includes(viewer.role)) redirect(homeFor(viewer.role));
  return viewer;
}

/** Records that a mentor or admin viewed or changed a student's records. */
export async function logAccess(viewer: Viewer, studentId: string, action: "view" | "update", resource: string) {
  if (viewer.role === "student") return;
  await adminDb().insert(schema.accessLog).values({ actorProfileId: viewer.profileId, studentId, action, resource });
}
