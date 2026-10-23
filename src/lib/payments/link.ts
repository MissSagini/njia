import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

/**
 * A payment link is the enrolment ID plus a signature, so it can be shared with a
 * parent but not guessed or altered. It only lets someone pay; the page shows
 * the amount and the student's first name, nothing else.
 */

function sign(enrolmentId: string) {
  return createHmac("sha256", serverEnv().SUPABASE_SECRET_KEY).update(`njia-pay:${enrolmentId}`).digest("base64url").slice(0, 32);
}

export function payToken(enrolmentId: string) {
  return `${enrolmentId}.${sign(enrolmentId)}`;
}

export function payPath(enrolmentId: string) {
  return `/pay/${payToken(enrolmentId)}`;
}

/** The enrolment ID if the token is genuine, otherwise null. */
export function enrolmentFromToken(token: string): string | null {
  const [id, sig] = token.split(".");
  if (!id || !sig || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const expected = Buffer.from(sign(id));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given) ? id : null;
}
