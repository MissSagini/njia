/** Shared by the proxy and server code, so it must not import server-only modules. */

export type Role = "student" | "mentor" | "admin";

export function homeFor(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "mentor") return "/students";
  return "/my-mentor";
}

/** Which role may open each signed-in area. Checked in the proxy and again in each layout. */
export const PROTECTED_AREAS: { prefix: string; roles: readonly Role[] }[] = [
  { prefix: "/my-mentor", roles: ["student"] },
  { prefix: "/sessions", roles: ["student"] },
  { prefix: "/my-goals", roles: ["student"] },
  { prefix: "/students", roles: ["mentor"] },
  { prefix: "/free-times", roles: ["mentor"] },
  { prefix: "/admin", roles: ["admin"] },
];

export function areaFor(pathname: string) {
  return PROTECTED_AREAS.find((a) => pathname === a.prefix || pathname.startsWith(a.prefix + "/"));
}

export function isRole(value: unknown): value is Role {
  return value === "student" || value === "mentor" || value === "admin";
}

/** Only allow redirects back to our own pages. */
export function safeNextPath(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

/** Password rule, checked when a password is set. */
export const MIN_PASSWORD_LENGTH = 10;
