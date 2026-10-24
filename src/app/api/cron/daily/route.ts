import { NextResponse, type NextRequest } from "next/server";
import { sendOverdueDigest, sendPaymentFollowUps } from "@/lib/email/notifications";
import { cronSecret } from "@/lib/env";

/**
 * Vercel Cron calls this every morning (see vercel.json) with the CRON_SECRET:
 * the team's list of paid students still waiting for a mentor, and one payment
 * follow-up for students whose free call was 3 days ago. Safe to repeat.
 */
export async function GET(request: NextRequest) {
  const secret = cronSecret();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const [digest, followUps] = await Promise.all([sendOverdueDigest(), sendPaymentFollowUps()]);
  return NextResponse.json({ overdue: digest.overdue, digestSent: digest.sent, followUpsSent: followUps.sent });
}
