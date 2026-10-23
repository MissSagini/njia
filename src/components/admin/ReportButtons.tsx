"use client";

import { useState, useTransition } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { sendReportsNow, sendReportTest, type ReportState } from "@/lib/admin/actions";

/** Runs a report action and shows what happened. */
function ReportButton({ label, busyLabel, run }: { label: string; busyLabel: string; run: () => Promise<ReportState> }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ReportState>({});
  return (
    <div className="flex flex-col gap-3">
      <Button variant="outline" size="md" loading={pending} className="self-start" onClick={() => start(async () => setResult(await run()))}>
        {pending ? busyLabel : label}
      </Button>
      {result.error ? <Banner tone="error">{result.error}</Banner> : null}
      {result.message ? <Banner tone="success">{result.message}</Banner> : null}
    </div>
  );
}

export function SendReportsNow() {
  return <ReportButton label="Send this week's reports now" busyLabel="Sending reports…" run={sendReportsNow} />;
}

export function SendReportTest({ studentId }: { studentId: string }) {
  return <ReportButton label="Send a test to me" busyLabel="Sending…" run={() => sendReportTest(studentId)} />;
}
