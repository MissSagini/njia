"use client";

import { useState, useTransition } from "react";
import { TimeChooser, type OpenTime } from "@/components/booking/TimeChooser";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { cancelCall, changeCall } from "@/lib/calls/actions";
import { EAT } from "@/lib/time";

/** Move or cancel the free call, while there's still enough notice. */
export function FreeCallControls({ openTimes, canChange }: { openTimes: OpenTime[]; canChange: boolean }) {
  const [mode, setMode] = useState<"idle" | "moving" | "cancelling">("idle");
  const [toast, setToast] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  if (!canChange) {
    return <p className="m-0 text-body text-ink-muted">Need to change it? Message us at hello@njia.co.ke.</p>;
  }

  return (
    <div className="flex flex-col gap-3 pt-2">
      {toast ? <Toast onDismiss={() => setToast(false)}>Call moved</Toast> : null}
      {mode === "moving" ? (
        <div className="flex flex-col gap-3 rounded-md border border-line p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="m-0 text-[15px] leading-[22px] font-semibold text-ink">Choose a new time (EAT)</h3>
            <Button variant="ghost" size="md" onClick={() => setMode("idle")}>
              Keep this time
            </Button>
          </div>
          <TimeChooser
            freeTimes={openTimes}
            timeZone={EAT}
            action={changeCall}
            field="slotId"
            onDone={() => {
              setMode("idle");
              setToast(true);
            }}
            labels={["Move my call to this time", "Moving your call…"]}
          />
        </div>
      ) : mode === "cancelling" ? (
        <div className="flex flex-col gap-2 rounded-md border border-line bg-cream p-3">
          <p className="m-0 text-body text-ink">
            Cancel your free call? If you already know what you need, you can pay below and we&apos;ll pair you with a mentor.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="md" loading={pending} onClick={() => start(async () => setError((await cancelCall()).error))}>
              {pending ? "Cancelling…" : "Yes, cancel it"}
            </Button>
            <Button variant="ghost" size="md" disabled={pending} onClick={() => setMode("idle")}>
              Keep it
            </Button>
          </div>
          {error ? <Banner tone="error">{error}</Banner> : null}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="md" iconLeft="calendar" onClick={() => setMode("moving")}>
            Change time
          </Button>
          <Button variant="ghost" size="md" onClick={() => setMode("cancelling")}>
            Cancel call
          </Button>
        </div>
      )}
    </div>
  );
}
