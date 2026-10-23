import { NextResponse, type NextRequest } from "next/server";
import { cronSecret } from "@/lib/env";
import { sendWeeklyReports } from "@/lib/reports/weekly";

/**
 * Vercel Cron calls this every Friday (see vercel.json) with the CRON_SECRET.
 * Sending is safe to repeat: each parent gets one report per week.
 */
export async function GET(request: NextRequest) {
  const secret = cronSecret();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const result = await sendWeeklyReports();
  return NextResponse.json({ sent: result.sent, skipped: result.skipped, failed: result.failed });
}
