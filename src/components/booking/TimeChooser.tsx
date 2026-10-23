"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { FormGroup } from "@/components/ui/FormLayout";
import { dayKey, formatDay, formatTime } from "@/lib/time";

export type OpenTime = { id: string; startsAt: string };
/** What a booking action returns: an error, a time someone else just took, or the booked time. */
export type ChooserState = { error?: string; takenId?: string; bookedAt?: string };

/** Day and time chips over open times (a mentor's free times or free call times), submitting to a booking action. */
export function TimeChooser({
  freeTimes,
  timeZone,
  action: serverAction,
  sessionId,
  field = "availabilityId",
  onDone,
  labels,
}: {
  freeTimes: OpenTime[];
  timeZone: string;
  action: (prev: ChooserState, formData: FormData) => Promise<ChooserState>;
  sessionId?: string;
  /** Form field for the chosen time's ID. */
  field?: string;
  onDone: () => void;
  labels: [idle: string, busy: string];
}) {
  const [state, action, pending] = useActionState<ChooserState, FormData>(serverAction, {});
  const [chosen, setChosen] = useState("");
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.takenId) {
      setTaken(new Set(taken).add(state.takenId));
      setChosen("");
    }
    if (state.bookedAt) setChosen("");
  }
  // Tell the parent after rendering, not during it
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });
  useEffect(() => {
    if (state.bookedAt) onDoneRef.current();
  }, [state.bookedAt]);

  const days = useMemo(() => groupByDay(freeTimes, timeZone), [freeTimes, timeZone]);
  const [dayKeyChosen, setDayKey] = useState(days[0]?.key ?? "");
  const day = days.find((d) => d.key === dayKeyChosen) ?? days[0];
  if (!day) return <p className="m-0 text-body text-ink-muted">There are no other free times right now.</p>;

  return (
    <form action={action} className="m-0 flex flex-col gap-4">
      <input type="hidden" name={field} value={chosen} />
      {sessionId ? <input type="hidden" name="sessionId" value={sessionId} /> : null}
      <FormGroup legend="Day" className="gap-2">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {days.map((d) => (
            <ChoiceChip key={d.key} label={d.label} selected={d.key === day.key} onPick={() => setDayKey(d.key)} />
          ))}
        </div>
      </FormGroup>
      <FormGroup legend="Time" className="gap-2">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {day.times.map((t) => (
            <ChoiceChip
              key={t.id}
              label={formatTime(t.startsAt, timeZone)}
              selected={t.id === chosen}
              disabled={taken.has(t.id)}
              onPick={() => setChosen(t.id)}
            />
          ))}
        </div>
      </FormGroup>
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}
      <Button type="submit" variant="primary" fullWidth loading={pending} disabled={!chosen && !pending}>
        {pending ? labels[1] : chosen ? labels[0] : "Choose a time first"}
      </Button>
    </form>
  );
}

function groupByDay(times: OpenTime[], timeZone: string) {
  const byDay = new Map<string, OpenTime[]>();
  for (const t of times) {
    const key = dayKey(t.startsAt, timeZone);
    byDay.set(key, [...(byDay.get(key) ?? []), t]);
  }
  return [...byDay.entries()].map(([key, list]) => ({ key, label: formatDay(list[0].startsAt, timeZone), times: list }));
}
